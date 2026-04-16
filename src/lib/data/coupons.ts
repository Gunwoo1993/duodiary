import type { CouponRow } from './types';
import { invokeAuthedFunction } from './functions';

export async function listCoupons(coupleId: string) {
  const out = await invokeAuthedFunction<{ coupons?: CouponRow[]; error?: string }>('list_coupons', { couple_id: coupleId });
  if (!out?.coupons) throw new Error(out?.error || 'Failed to load coupons');
  return out.coupons;
}

export async function createCoupon(input: Omit<CouponRow, 'id' | 'created_at' | 'scheduled_for' | 'used_at'>) {
  const out = await invokeAuthedFunction<{ coupon?: CouponRow; error?: string }>('create_coupon', input);
  if (!out?.coupon) throw new Error(out?.error || 'Failed to create coupon');
  return out.coupon;
}

export async function scheduleUseCoupon(params: { id: string; scheduled_for: string }) {
  const out = await invokeAuthedFunction<{ coupon?: CouponRow; error?: string }>('use_coupon', params);
  if (!out?.coupon) throw new Error(out?.error || 'Failed to use coupon');
  return out.coupon;
}

export async function refundCoupon(id: string) {
  const out = await invokeAuthedFunction<{ coupon?: CouponRow; error?: string }>('refund_coupon', { id });
  if (!out?.coupon) throw new Error(out?.error || 'Failed to refund coupon');
  return out.coupon;
}
