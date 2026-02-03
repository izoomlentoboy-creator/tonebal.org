import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "email",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

describe("nosologies router", () => {
  it("should return all nosologies", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const nosologies = await caller.nosologies.getAll();

    expect(nosologies).toBeDefined();
    expect(Array.isArray(nosologies)).toBe(true);
    expect(nosologies.length).toBe(10);
    
    // Проверяем бесплатные разделы
    const freeNosologies = nosologies.filter(n => n.isFree);
    expect(freeNosologies.length).toBe(2);
    expect(freeNosologies.some(n => n.id === 'introduction')).toBe(true);
    expect(freeNosologies.some(n => n.id === 'breathing')).toBe(true);
  });

  it("should return specific nosology by id", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const nosology = await caller.nosologies.getById({ id: "introduction" });

    expect(nosology).toBeDefined();
    expect(nosology.id).toBe("introduction");
    expect(nosology.name).toBe("Введение");
    expect(nosology.isFree).toBe(true);
    expect(nosology.lessons).toBeDefined();
    expect(nosology.lessons.length).toBeGreaterThan(0);
  });

  it("should return lesson details", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const lesson = await caller.nosologies.getLesson({
      nosologyId: "introduction",
      lessonId: "intro_1",
    });

    expect(lesson).toBeDefined();
    expect(lesson.id).toBe("intro_1");
    expect(lesson.title).toBeDefined();
    expect(lesson.goal).toBeDefined();
    expect(lesson.steps).toBeDefined();
    expect(Array.isArray(lesson.steps)).toBe(true);
    expect(lesson.methodology).toBeDefined();
    expect(lesson.errors).toBeDefined();
  });
});

describe("subscription router", () => {
  it("should allow access to free nosologies without subscription", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const introAccess = await caller.subscription.checkAccess({ nosologyId: "introduction" });
    expect(introAccess.hasAccess).toBe(true);
    expect(introAccess.reason).toBe("free");

    const breathingAccess = await caller.subscription.checkAccess({ nosologyId: "breathing" });
    expect(breathingAccess.hasAccess).toBe(true);
    expect(breathingAccess.reason).toBe("free");
  });

  it("should deny access to premium nosologies without subscription", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const premiumAccess = await caller.subscription.checkAccess({ nosologyId: "voice-setting" });
    expect(premiumAccess.hasAccess).toBe(false);
    expect(premiumAccess.reason).toBe("no_subscription");
  });
});

describe("payment router", () => {
  it("should create payment with valid amount", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const payment = await caller.payment.createPayment({ amount: 99000 });

    expect(payment).toBeDefined();
    expect(payment.paymentId).toBeDefined();
    expect(payment.confirmationUrl).toBeDefined();
    expect(payment.paymentId).toContain("demo_");
  });
});

describe("auth router", () => {
  it("should return current user info", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const user = await caller.auth.me();

    expect(user).toBeDefined();
    expect(user?.id).toBe(1);
    expect(user?.email).toBe("test@example.com");
    expect(user?.name).toBe("Test User");
  });

  it("should logout successfully", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.logout();

    expect(result.success).toBe(true);
  });
});
