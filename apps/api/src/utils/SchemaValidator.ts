import { z } from 'zod';

export class SchemaValidator {
  // USERS
  static USER_SCHEMA = z.object({
    firstname: z.string().min(1, 'First name is required'),
    lastname: z.string().min(1, 'Last name is required'),
    email: z.string().email('Invalid email format'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Must include an uppercase letter')
      .regex(/[a-z]/, 'Must include a lowercase letter')
      .regex(/[0-9]/, 'Must include a number'),
  });

  static VALIDATE_USER_SCHEMA(data: unknown) {
    const result = this.USER_SCHEMA.safeParse(data);
    return result.success
      ? { success: true, data: result.data }
      : { success: false, errors: result.error.format() };
  }

  // SUBSCRIPTION_PLANS
  static PLAN_SCHEMA = z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    price: z.number().nonnegative(),
    billing_interval: z.string().min(1),
    features: z.unknown().optional(),
    is_active: z.boolean().optional(),
  });

  static VALIDATE_PLAN_SCHEMA(data: unknown) {
    const result = this.PLAN_SCHEMA.safeParse(data);
    return result.success
      ? { success: true, data: result.data }
      : { success: false, errors: result.error.format() };
  }

  // USER_SUBSCRIPTIONS
  static USER_SUBSCRIPTION_SCHEMA = z.object({
    user_id: z.string().min(1),
    plan_id: z.number().int(),
    status: z.string().min(1),
    start_date: z.coerce.date(),
    end_date: z.coerce.date().optional(),
    trial_end_date: z.coerce.date().optional(),
    canceled_at: z.coerce.date().optional(),
    payment_method_id: z.string().optional(),
    auto_renew: z.boolean().optional(),
    free_chat_credit: z.number().int().nonnegative().optional(),
    free_url_credit: z.number().int().nonnegative().optional(),
  });

  static VALIDATE_USER_SUBSCRIPTION_SCHEMA(data: unknown) {
    const result = this.USER_SUBSCRIPTION_SCHEMA.safeParse(data);
    return result.success
      ? { success: true, data: result.data }
      : { success: false, errors: result.error.format() };
  }

  // PAYMENTS
  static PAYMENT_SCHEMA = z.object({
    subscription_id: z.number().int(),
    amount: z.number().nonnegative(),
    currency: z.string().length(3).optional(),
    payment_date: z.coerce.date(),
    status: z.string().min(1),
    payment_method: z.string().optional(),
    payment_processor: z.string().optional(),
    transaction_id: z.string().optional(),
    receipt_url: z.string().url().optional(),
  });

  static VALIDATE_PAYMENT_SCHEMA(data: unknown) {
    const result = this.PAYMENT_SCHEMA.safeParse(data);
    return result.success
      ? { success: true, data: result.data }
      : { success: false, errors: result.error.format() };
  }

  // QUERY VALIDATOR
  static QUERY_VALIDATOR_SCHEMA = z.object({
    user_id: z.string().min(1, 'user_id is required'),
    bot_id: z.string().min(1, 'bot_id is required'),
    kb_id: z.string().min(1, 'kb_id is required'),
    session_id: z.string().min(1, 'session_id is required'),
    input_text: z.string().min(1, 'input_text cannot be empty'),
  });

  static VALIDATE_QUERY_SCHEMA(data: unknown) {
    const result = this.QUERY_VALIDATOR_SCHEMA.safeParse(data);
    return result.success
      ? { success: true, data: result.data }
      : { success: false, errors: result.error.format() };
  }

  static URL_VALIDATOR_SCHEMA = z.object({
    user_id: z.string().min(1, 'user_id is required'),
    url: z.string().url('Must be a valid URL'),
  });

  static VALIDATE_URL_SCHEMA(data: unknown) {
    const result = this.URL_VALIDATOR_SCHEMA.safeParse(data);
    return result.success
      ? { success: true, data: result.data }
      : { success: false, errors: result.error.format() };
  }

  // BOT
  static BOT_SCHEMA = z.object({
    user_id: z.string().min(1, 'user_id is required'),
    bot_id: z.string().min(1, 'bot_id is required'),
    kb_id: z.string().min(1, 'kb_id is required'),
    csv: z.array(z.string()).optional(),
    pdf: z.array(z.string()).optional(),
    txt: z.array(z.string()).optional(),
    json: z.array(z.string()).optional(),
    web_url: z
      .array(z.string().url('Each web_url must be a valid URL'))
      .optional(),
    prompt_template: z.string().optional(),
    temperature: z.number().min(0).max(1).optional(),
    theme: z.string().optional(),
    bot_name: z.string().min(1, 'bot_name is required'),
    profile_image: z
      .string()
      .url('profile_image must be a valid URL')
      .optional(),
    model: z.string().optional(),
  });

  static VALIDATE_BOT_SCHEMA(data: unknown) {
    const result = this.BOT_SCHEMA.safeParse(data);
    return result.success
      ? { success: true, data: result.data }
      : { success: false, errors: result.error.format() };
  }
}
