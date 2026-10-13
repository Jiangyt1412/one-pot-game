import { it, expect, vi } from 'vitest';
import { SaveService } from '../src/services/SaveService';
// # Updating motion defaults preserves a user's completed levels and inventory, then respects later choices.
it('enables floating once for old saves without deleting progress, and retains later explicit reduced motion',()=>{
  let stored=JSON.stringify({version:1,highestLevel:12,completed:[1,2,3],grantedLevels:[1,2,3],tools:{shuffle:8,match:7,return:6},settings:{sound:false,music:true,effects:true,reducedMotion:true}});
  vi.stubGlobal('localStorage',{getItem:()=>stored,setItem:(_key:string,value:string)=>{stored=value;}});
  try{
    const migrated=new SaveService();expect(migrated.data.highestLevel).toBe(12);expect(migrated.data.completed).toEqual([1,2,3]);expect(migrated.data.tools).toEqual({shuffle:8,match:7,return:6});expect(migrated.data.settings.sound).toBe(false);expect(migrated.data.settings.reducedMotion).toBe(false);
    migrated.data.settings.reducedMotion=true;migrated.persist();expect(new SaveService().data.settings.reducedMotion).toBe(true);
  }finally{vi.unstubAllGlobals();}
});
