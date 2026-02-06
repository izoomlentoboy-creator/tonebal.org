import { COOKIE_NAME } from "../shared/const.js";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies.js";
import { ENV } from "./_core/env.js";
import { systemRouter } from "./_core/systemRouter.js";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc.js";
import * as db from "./db.js";
import {
  generateAccessCode,
  calculateExpiryDate,
  getDaysRemaining,
  validateAccessCode,
  normalizeAccessCode,
  shouldRotateCode,
  getCodeRotationInfo,
} from "./utils/accessCode.js";
import { createPayment, getPaymentStatus } from "./services/yookassa.js";
import nosologiesData from "../shared/nosologies.json" with { type: "json" };

// Type for nosology data
type NosologyData = {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  lessonCount: number;
  duration: string;
  isFree: boolean;
  lessons: Array<{
    id: string;
    title: string;
    goal: string;
    duration: number;
    videoUrl: string | null;
    steps: Array<{ number: number; text: string; duration?: number }>;
    methodology: { icon: string; title: string; items: string[] };
    errors: { icon: string; title: string; items: string[]; isWarning?: boolean };
  }>;
};

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: protectedProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // Nosologies
  nosologies: router({
    getAll: publicProcedure.query(() => {
      return Object.values(nosologiesData);
    }),

    getById: publicProcedure
      .input(z.object({ id: z.string() }))
      .query(({ input }) => {
        const nosology = nosologiesData[input.id as keyof typeof nosologiesData];
        if (!nosology) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Nosology not found" });
        }
        return nosology;
      }),

    getLesson: publicProcedure
      .input(z.object({
        nosologyId: z.string(),
        lessonId: z.string()
      }))
      .query(({ input }) => {
        const nosology = nosologiesData[input.nosologyId as keyof typeof nosologiesData];
        if (!nosology) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Nosology not found" });
        }

        const lesson = nosology.lessons.find(l => l.id === input.lessonId);
        if (!lesson) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Lesson not found" });
        }

        return lesson;
      }),
  }),

  // Subscription
  subscription: router({
    getMy: protectedProcedure.query(async ({ ctx }) => {
      const subscription = await db.getActiveSubscription(ctx.user.id);

      if (!subscription) {
        return null;
      }

      // Check if code needs rotation
      if (shouldRotateCode(subscription.codeGeneratedAt, subscription.expiresAt)) {
        // Determine plan type by checking payment
        const plan = subscription.paymentId ? 'monthly' : 'monthly';
        const newCode = generateAccessCode(plan);
        await db.rotateSubscriptionCode(subscription.id, newCode);
        // Refetch after rotation
        const updated = await db.getActiveSubscription(ctx.user.id);
        if (!updated) return null;

        const rotationInfo = getCodeRotationInfo(updated.codeGeneratedAt, updated.expiresAt);
        return {
          ...updated,
          daysRemaining: getDaysRemaining(updated.expiresAt),
          canCancelReveal: false,
          accessCode: "****-****",
          accessCodeMasked: true,
          codeRotation: rotationInfo,
        };
      }

      // Calculate if cancel is still possible (within 5 minutes of reveal)
      let canCancelReveal = false;
      if (subscription.codeRevealed === 1 && subscription.codeRevealedAt) {
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        canCancelReveal = subscription.codeRevealedAt > fiveMinutesAgo;
      }

      const rotationInfo = getCodeRotationInfo(subscription.codeGeneratedAt, subscription.expiresAt);

      return {
        ...subscription,
        daysRemaining: getDaysRemaining(subscription.expiresAt),
        canCancelReveal,
        // Mask code if not revealed
        accessCode:
          subscription.codeRevealed === 1 ? subscription.accessCode : "****-****",
        accessCodeMasked: subscription.codeRevealed !== 1,
        codeRotation: rotationInfo,
      };
    }),

    // Reveal the access code (one-time action)
    revealCode: protectedProcedure.mutation(async ({ ctx }) => {
      const subscription = await db.getActiveSubscription(ctx.user.id);

      if (!subscription) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Подписка не найдена" });
      }

      if (subscription.codeRevealed === 1) {
        // Already revealed, just return the code
        return {
          accessCode: subscription.accessCode,
          alreadyRevealed: true,
        };
      }

      // Reveal the code
      await db.revealAccessCode(subscription.id);

      return {
        accessCode: subscription.accessCode,
        alreadyRevealed: false,
        canCancelUntil: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
      };
    }),

    // Cancel code reveal (within 5 minutes)
    cancelReveal: protectedProcedure.mutation(async ({ ctx }) => {
      const subscription = await db.getActiveSubscription(ctx.user.id);

      if (!subscription) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Подписка не найдена" });
      }

      try {
        await db.cancelCodeReveal(subscription.id);
        return { success: true };
      } catch (error) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: error instanceof Error ? error.message : "Не удалось отменить",
        });
      }
    }),

    checkAccess: protectedProcedure
      .input(z.object({ nosologyId: z.string() }))
      .query(async ({ ctx, input }) => {
        // Бесплатные разделы
        if (input.nosologyId === "introduction" || input.nosologyId === "breathing") {
          return { hasAccess: true, reason: "free" };
        }

        // Проверяем подписку
        const subscription = await db.getActiveSubscription(ctx.user.id);
        if (subscription && new Date(subscription.expiresAt) > new Date()) {
          return { hasAccess: true, reason: "subscription" };
        }

        return { hasAccess: false, reason: "no_subscription" };
      }),
  }),

  // Progress
  progress: router({
    getMy: protectedProcedure.query(async ({ ctx }) => {
      return await db.getUserProgress(ctx.user.id);
    }),

    markComplete: protectedProcedure
      .input(
        z.object({
          nosologyId: z.string(),
          lessonId: z.string(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        await db.markLessonComplete(ctx.user.id, input.nosologyId, input.lessonId);
        return { success: true };
      }),

    // Get calendar with completed days for a month
    getCalendar: protectedProcedure
      .input(
        z.object({
          year: z.number(),
          month: z.number().min(1).max(12),
        })
      )
      .query(async ({ ctx, input }) => {
        const dates = await db.getProgressCalendar(ctx.user.id, input.year, input.month);
        return { dates };
      }),

    // Get activity stats for last N days
    getStats: protectedProcedure
      .input(
        z.object({
          days: z.number().min(1).max(90).optional().default(7),
        })
      )
      .query(async ({ ctx, input }) => {
        const stats = await db.getActivityStats(ctx.user.id, input.days);
        // Calculate total lessons available
        const totalLessons = Object.values(nosologiesData).reduce(
          (sum, n) => sum + (n as NosologyData).lessonCount,
          0
        );
        const completedLessons =
          (await db.getUserProgress(ctx.user.id)).filter((p) => p.completed === 1).length || 0;

        return {
          dailyStats: stats,
          totalLessons,
          completedLessons,
          completionPercent: Math.round((completedLessons / totalLessons) * 100),
        };
      }),

    // Get daily XP progress (timezone-aware)
    getDailyProgress: protectedProcedure.query(async ({ ctx }) => {
      const user = await db.getUserById(ctx.user.id);
      const timezone = user?.timezone || "Europe/Moscow";

      // Get user's selected directions
      const directions = await db.getUserDirections(ctx.user.id);

      if (directions.length === 0) {
        return {
          totalRequired: 0,
          completedToday: 0,
          percent: 0,
          streak: 0,
          directions: [],
        };
      }

      // Count total lessons across all directions
      let totalRequired = 0;
      const directionDetails: Array<{
        nosologyId: string;
        name: string;
        icon: string;
        totalLessons: number;
        completedToday: number;
      }> = [];

      for (const dir of directions) {
        const nosology = nosologiesData[dir.nosologyId as keyof typeof nosologiesData] as NosologyData | undefined;
        if (nosology) {
          totalRequired += nosology.lessonCount;
          directionDetails.push({
            nosologyId: dir.nosologyId,
            name: nosology.name,
            icon: nosology.icon,
            totalLessons: nosology.lessonCount,
            completedToday: 0,
          });
        }
      }

      // Get lessons completed today
      const todayLessons = await db.getTodayCompletedLessons(ctx.user.id, timezone);
      const completedToday = todayLessons.length;

      // Count per direction
      for (const detail of directionDetails) {
        detail.completedToday = todayLessons.filter(
          l => l.nosologyId === detail.nosologyId
        ).length;
      }

      // Get streak
      const streak = await db.getActivityStreak(ctx.user.id, timezone);

      return {
        totalRequired,
        completedToday,
        percent: totalRequired > 0 ? Math.round((completedToday / totalRequired) * 100) : 0,
        streak,
        directions: directionDetails,
      };
    }),
  }),

  // Voice Ratings
  voiceRating: router({
    add: protectedProcedure
      .input(
        z.object({
          rating: z.number().min(1).max(10),
          note: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        await db.addVoiceRating({
          userId: ctx.user.id,
          rating: input.rating,
          note: input.note,
        });
        return { success: true };
      }),

    getMy: protectedProcedure
      .input(
        z.object({
          limit: z.number().min(1).max(100).optional().default(30),
        })
      )
      .query(async ({ ctx, input }) => {
        return await db.getUserVoiceRatings(ctx.user.id, input.limit);
      }),

    getByDateRange: protectedProcedure
      .input(
        z.object({
          startDate: z.string(),
          endDate: z.string(),
        })
      )
      .query(async ({ ctx, input }) => {
        return await db.getVoiceRatingsByDateRange(
          ctx.user.id,
          new Date(input.startDate),
          new Date(input.endDate)
        );
      }),
  }),

  // User Directions (supports multiple selections)
  direction: router({
    getMy: protectedProcedure.query(async ({ ctx }) => {
      const directions = await db.getUserDirections(ctx.user.id);

      return directions.map(dir => {
        const nosology = nosologiesData[dir.nosologyId as keyof typeof nosologiesData];
        return {
          ...dir,
          nosology: nosology || null,
        };
      });
    }),

    setMy: protectedProcedure
      .input(
        z.object({
          nosologyIds: z.array(z.string()).min(1),
        })
      )
      .mutation(async ({ ctx, input }) => {
        // Verify all nosologies exist
        for (const id of input.nosologyIds) {
          const nosology = nosologiesData[id as keyof typeof nosologiesData];
          if (!nosology) {
            throw new TRPCError({ code: "NOT_FOUND", message: `Направление ${id} не найдено` });
          }
        }

        await db.setUserDirections(ctx.user.id, input.nosologyIds);
        return { success: true };
      }),
  }),

  // User management
  user: router({
    setTimezone: protectedProcedure
      .input(z.object({
        timezone: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.updateUserTimezone(ctx.user.id, input.timezone);
        return { success: true };
      }),

    updatePassword: protectedProcedure
      .input(z.object({
        currentPassword: z.string(),
        newPassword: z.string().min(6),
      }))
      .mutation(async ({ ctx, input }) => {
        throw new TRPCError({
          code: "NOT_IMPLEMENTED",
          message: "Password change not available for OAuth users"
        });
      }),

    deleteAccount: protectedProcedure.mutation(async ({ ctx }) => {
      throw new TRPCError({
        code: "NOT_IMPLEMENTED",
        message: "Account deletion coming soon"
      });
    }),
  }),

  // Payment (YooKassa integration)
  payment: router({
    // Получить информацию о подписках
    getInfo: publicProcedure.query(() => {
      // Рассчитываем выгоду годовой подписки
      const monthlyYearCost = ENV.subscriptionPrice * 12; // 30000₽
      const yearlyCost = ENV.subscriptionYearlyPrice; // 18990₽
      const savings = monthlyYearCost - yearlyCost; // 11010₽
      const savingsPercent = Math.round((savings / monthlyYearCost) * 100); // 37%

      return {
        // Monthly subscription
        price: ENV.subscriptionPrice,
        days: ENV.subscriptionDays,
        // Yearly subscription
        yearlyPrice: ENV.subscriptionYearlyPrice,
        yearlyDays: ENV.subscriptionYearlyDays,
        savingsPercent,
        savingsAmount: savings,
        currency: "RUB",
      };
    }),

    // Создание платежа через YooKassa
    createPayment: protectedProcedure
      .input(z.object({
        returnUrl: z.string().url().optional(),
        planType: z.enum(["monthly", "yearly"]).optional().default("monthly"),
      }))
      .mutation(async ({ ctx, input }) => {
        const returnUrl = input.returnUrl || `${ENV.baseUrl}/payment/success`;
        const isYearly = input.planType === "yearly";

        const price = isYearly ? ENV.subscriptionYearlyPrice : ENV.subscriptionPrice;
        const days = isYearly ? ENV.subscriptionYearlyDays : ENV.subscriptionDays;
        const planLabel = isYearly ? "на 1 год" : `на ${days} дней`;

        // Создаём платёж в YooKassa
        const result = await createPayment({
          userId: ctx.user.id,
          returnUrl: `${returnUrl}?userId=${ctx.user.id}&planType=${input.planType}`,
          description: `Подписка Tone Balance ${planLabel}`,
          amount: price,
        });

        if ("error" in result) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: result.error
          });
        }

        // Сохраняем платёж в БД с информацией о типе плана
        await db.createPayment({
          userId: ctx.user.id,
          yookassaPaymentId: result.paymentId,
          amount: price * 100, // в копейках
          status: "pending",
          nosology: isYearly ? "all_yearly" : "all",
        });

        return {
          paymentId: result.paymentId,
          confirmationUrl: result.confirmationUrl,
          amount: price,
          planType: input.planType,
          days,
        };
      }),

    // Проверка статуса платежа и активация подписки
    checkPaymentStatus: publicProcedure
      .input(z.object({
        paymentId: z.string(),
      }))
      .query(async ({ input }) => {
        // Получаем актуальный статус из YooKassa
        const yooKassaPayment = await getPaymentStatus(input.paymentId);

        if (!yooKassaPayment) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Платёж не найден" });
        }

        // Получаем запись из БД
        const dbPayment = await db.getPaymentByYookassaId(input.paymentId);

        // Если платёж успешен и ещё не обработан
        if (yooKassaPayment.status === "succeeded" && yooKassaPayment.paid) {
          if (dbPayment && dbPayment.status !== "succeeded") {
            // Обновляем статус платежа
            await db.updatePaymentStatus(input.paymentId, "succeeded");

            // Определяем тип подписки по сохраненному nosology
            const isYearly = dbPayment.nosology === "all_yearly";
            const plan = isYearly ? "yearly" : "monthly";
            const days = isYearly ? ENV.subscriptionYearlyDays : ENV.subscriptionDays;

            // Проверяем существующую активную подписку для продления
            const existingSubscription = await db.getActiveSubscription(dbPayment.userId);
            const baseDate = existingSubscription?.expiresAt;

            // Создаём подписку с криптостойким кодом (разные ключи для разных планов)
            const accessCode = generateAccessCode(plan);
            // Если есть активная подписка - добавляем дни к ней, иначе от текущей даты
            const expiresAt = calculateExpiryDate(days, baseDate);

            await db.createSubscription({
              userId: dbPayment.userId,
              paymentId: input.paymentId,
              accessCode,
              expiresAt,
              isActive: 1,
            });

            const isRenewal = !!existingSubscription;
            console.log(`[Payment] Subscription ${isRenewal ? 'renewed' : 'activated'} for user ${dbPayment.userId}, code: ${accessCode}, days: ${days}${isRenewal ? ' (added to existing)' : ''}`);

            return {
              status: "succeeded",
              paid: true,
              accessCode,
              expiresAt: expiresAt.toISOString(),
              daysRemaining: days,
              planType: isYearly ? "yearly" : "monthly",
            };
          }

          // Платёж уже был обработан, получаем код из подписки
          if (dbPayment) {
            const subscription = await db.getActiveSubscription(dbPayment.userId);
            return {
              status: "succeeded",
              paid: true,
              accessCode: subscription?.accessCode || null,
              expiresAt: subscription?.expiresAt?.toISOString() || null,
              daysRemaining: subscription ? getDaysRemaining(subscription.expiresAt) : 0,
              planType: dbPayment.nosology === "all_yearly" ? "yearly" : "monthly",
            };
          }
        }

        return {
          status: yooKassaPayment.status,
          paid: yooKassaPayment.paid,
          accessCode: null,
          expiresAt: null,
          daysRemaining: 0,
          planType: null,
        };
      }),

    // Webhook для обработки уведомлений от YooKassa
    processWebhook: publicProcedure
      .input(z.object({
        type: z.string(),
        event: z.string(),
        object: z.object({
          id: z.string(),
          status: z.string(),
          paid: z.boolean().optional(),
          metadata: z.record(z.string(), z.string()).optional(),
        }),
      }))
      .mutation(async ({ input }) => {
        if (input.type !== "notification") {
          return { status: "ignored" };
        }

        const { event, object } = input;
        console.log(`[Webhook] Event: ${event}, Payment ID: ${object.id}`);

        if (event === "payment.succeeded") {
          const dbPayment = await db.getPaymentByYookassaId(object.id);

          if (dbPayment && dbPayment.status !== "succeeded") {
            await db.updatePaymentStatus(object.id, "succeeded");

            // Определяем тип плана по nosology
            const isYearly = dbPayment.nosology === "all_yearly";
            const plan = isYearly ? "yearly" : "monthly";
            const days = isYearly ? ENV.subscriptionYearlyDays : ENV.subscriptionDays;

            // Проверяем существующую активную подписку для продления
            const existingSubscription = await db.getActiveSubscription(dbPayment.userId);
            const baseDate = existingSubscription?.expiresAt;

            const accessCode = generateAccessCode(plan);
            // Если есть активная подписка - добавляем дни к ней, иначе от текущей даты
            const expiresAt = calculateExpiryDate(days, baseDate);

            await db.createSubscription({
              userId: dbPayment.userId,
              paymentId: object.id,
              accessCode,
              expiresAt,
              isActive: 1,
            });

            const isRenewal = !!existingSubscription;
            console.log(`[Webhook] Subscription ${isRenewal ? 'renewed' : 'activated'} for user ${dbPayment.userId}${isRenewal ? ' (days added to existing)' : ''}`);
          }
        }

        if (event === "payment.canceled") {
          await db.updatePaymentStatus(object.id, "canceled");
          console.log(`[Webhook] Payment canceled: ${object.id}`);
        }

        return { status: "ok" };
      }),
  }),

  // Access Code API (для iOS приложения)
  accessCode: router({
    // Валидация кода доступа (без активации)
    validate: publicProcedure
      .input(z.object({
        code: z.string(),
      }))
      .query(({ input }) => {
        const result = validateAccessCode(input.code);
        return {
          valid: result.valid,
          error: result.error || null,
        };
      }),

    // Активация кода доступа для iOS приложения
    activate: publicProcedure
      .input(z.object({
        code: z.string(),
        userId: z.string(), // Apple User ID или сгенерированный ID устройства
      }))
      .mutation(async ({ input }) => {
        const { code, userId } = input;

        // Валидируем код
        const validation = validateAccessCode(code);
        if (!validation.valid) {
          return {
            success: false,
            error: validation.error || "Invalid code",
            errorCode: "INVALID_CODE",
          };
        }

        // Нормализуем код
        const normalizedCode = normalizeAccessCode(code);

        // Проверяем, существует ли подписка с таким кодом
        const existingSubscription = await db.getSubscriptionByCode(normalizedCode);

        if (existingSubscription) {
          // Код уже использован
          const isActive = existingSubscription.isActive === 1 &&
            new Date(existingSubscription.expiresAt) > new Date();

          if (isActive) {
            // Код активен - возвращаем информацию о подписке
            return {
              success: true,
              isActive: true,
              expiresAt: existingSubscription.expiresAt.toISOString(),
              daysRemaining: getDaysRemaining(existingSubscription.expiresAt),
            };
          } else {
            // Код истёк
            return {
              success: false,
              error: "This code has expired",
              errorCode: "CODE_EXPIRED",
            };
          }
        }

        // Код ещё не использован
        return {
          success: false,
          error: "Code not found or not yet activated",
          errorCode: "CODE_NOT_FOUND",
        };
      }),

    // Проверка статуса подписки по userId (для iOS)
    checkSubscription: publicProcedure
      .input(z.object({
        userId: z.string(),
      }))
      .query(async ({ input }) => {
        // Находим пользователя по openId (Apple User ID)
        const user = await db.getUserByOpenId(input.userId);

        if (!user) {
          return {
            hasSubscription: false,
            isActive: false,
            accessCode: null,
            expiresAt: null,
            daysRemaining: 0,
          };
        }

        const subscription = await db.getActiveSubscription(user.id);

        if (!subscription) {
          return {
            hasSubscription: false,
            isActive: false,
            accessCode: null,
            expiresAt: null,
            daysRemaining: 0,
          };
        }

        const isActive = subscription.isActive === 1 &&
          new Date(subscription.expiresAt) > new Date();

        return {
          hasSubscription: true,
          isActive,
          accessCode: subscription.accessCode,
          expiresAt: subscription.expiresAt.toISOString(),
          daysRemaining: getDaysRemaining(subscription.expiresAt),
        };
      }),
  }),
});

export type AppRouter = typeof appRouter;
