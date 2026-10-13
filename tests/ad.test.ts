import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { AdService } from '../src/services/AdService';
// # Actual service timing: hidden time and early exits must never produce a reward.
beforeEach(()=>vi.useFakeTimers({toFake:['setInterval','clearInterval','performance']}));
afterEach(()=>vi.useRealTimers());
it('requires 10 seconds of visible playback before closing grants true',async()=>{
  const service=new AdService(10,()=>true);const result=service.showRewardedAd();vi.advanceTimersByTime(9900);expect(service.close()).toBe(false);expect(service.session?.done).toBe(false);
  vi.advanceTimersByTime(100);expect(service.session?.done).toBe(true);expect(service.close()).toBe(true);await expect(result).resolves.toBe(true);expect(service.session).toBe(null);
});
it('pauses countdown while hidden and resolves false on early cancellation',async()=>{
  let visible=true;const service=new AdService(10,()=>visible);const result=service.showRewardedAd();vi.advanceTimersByTime(3000);visible=false;vi.advanceTimersByTime(30000);expect(service.session?.remaining).toBe(7);visible=true;vi.advanceTimersByTime(1000);expect(service.session?.remaining).toBe(6);service.cancel();await expect(result).resolves.toBe(false);
});
