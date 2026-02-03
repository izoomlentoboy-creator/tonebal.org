import { COOKIE_NAME } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { ENV } from "./_core/env";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import * as db from "./db";
import { generateAccessCode, calculateExpiryDate, getDaysRemaining, validateAccessCode, normalizeAccessCode } from "./utils/accessCode";
import { createPayment, getPaymentStatus } from "./services/yookassa";
import nosologiesData from "../shared/nosologies.json";

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
      
      return {
        ...subscription,
        daysRemaining: getDaysRemaining(subscription.expiresAt),
      };
    }),
    
    checkAccess: protectedProcedure
      .input(z.object({ nosologyId: z.string() }))
      .query(async ({ ctx, input }) => {
        // Бесплатные разделы
        if (input.nosologyId === 'introduction' || input.nosologyId === 'breathing') {
          return { hasAccess: true, reason: 'free' };
        }
        
        // Проверяем подписку
        const subscription = await db.getActiveSubscription(ctx.user.id);
        if (subscription && new Date(subscription.expiresAt) > new Date()) {
          return { hasAccess: true, reason: 'subscription' };
        }
        
        return { hasAccess: false, reason: 'no_subscription' };
      }),
  }),

  // Progress
  progress: router({
    getMy: protectedProcedure.query(async ({ ctx }) => {
      return await db.getUserProgress(ctx.user.id);
    }),
    
    markComplete: protectedProcedure
      .input(z.object({
        nosologyId: z.string(),
        lessonId: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.markLessonComplete(ctx.user.id, input.nosologyId, input.lessonId);
        return { success: true };
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
            const days = isYearly ? ENV.subscriptionYearlyDays : ENV.subscriptionDays;

            // Создаём подписку с криптостойким кодом
            const accessCode = generateAccessCode();
            const expiresAt = calculateExpiryDate(days);

            await db.createSubscription({
              userId: dbPayment.userId,
              paymentId: input.paymentId,
              accessCode,
              expiresAt,
              isActive: 1,
            });

            console.log(`[Payment] Subscription activated for user ${dbPayment.userId}, code: ${accessCode}, days: ${days}`);

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
          metadata: z.record(z.string()).optional(),
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

            const accessCode = generateAccessCode();
            const expiresAt = calculateExpiryDate(ENV.subscriptionDays);

            await db.createSubscription({
              userId: dbPayment.userId,
              paymentId: object.id,
              accessCode,
              expiresAt,
              isActive: 1,
            });

            console.log(`[Webhook] Subscription activated for user ${dbPayment.userId}`);
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

        // Код ещё не использован - это означает, что код был сгенерирован
        // сервером при оплате, но ещё не привязан к подписке
        // Или это невалидный код (не существует в системе)
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

  // User management
  user: router({
    updatePassword: protectedProcedure
      .input(z.object({
        currentPassword: z.string(),
        newPassword: z.string().min(6),
      }))
      .mutation(async ({ ctx, input }) => {
        // TODO: Implement password change with hashing
        // Не доступно для OAuth пользователей
        throw new TRPCError({ 
          code: "NOT_IMPLEMENTED", 
          message: "Password change not available for OAuth users" 
        });
      }),
    
    deleteAccount: protectedProcedure.mutation(async ({ ctx }) => {
      // TODO: Implement account deletion
      // Удаление пользователя и всех связанных данных
      throw new TRPCError({ 
        code: "NOT_IMPLEMENTED", 
        message: "Account deletion coming soon" 
      });
    }),
  }),
});

export type AppRouter = typeof appRouter;
