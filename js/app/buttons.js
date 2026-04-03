// 顶部按钮与工具按钮绑定
import { S } from '../state.js';
import { setupPlay, useTeleport, useUndo, useShuffle, useAddSlot, payOrUse, refundPay, resetAfterLose } from '../game.js';
import { setupEditorGrid } from '../editor.js';
import { generateRandomLevelFromInputs } from '../editor/random-gen.js';
import { updateLevelHUD } from './hud.js';
import { status, saveLevel, loadLevel, deleteLevel, refreshSavedList, exportAllLevelsBundle, stringifyLevelsBundlePretty, importLevelsFromObject } from '../storage.js';

export function bindButtons(syncParams, applyModeUI){
  // 重新开始
  S.DOM.restart.onclick = ()=>{ syncParams(); setupPlay(false); };

  // 随机生成关卡
  S.DOM.next.onclick = ()=>{
    const ok = generateRandomLevelFromInputs();
    if (ok) {
      S.DOM.mode.value = 'play';
      applyModeUI?.();
      syncParams();
      setupPlay(false);
    }
  };

  // 创建空地板
  S.DOM.resize.onclick = ()=>{
    const SAFE_MAX = 99;
    const w = Math.min(SAFE_MAX, Math.max(5, parseInt(S.DOM.sizeW.value) || 15));
    const h = Math.min(SAFE_MAX, Math.max(5, parseInt(S.DOM.sizeH.value) || 15));
    S.DOM.sizeW.value = w; S.DOM.sizeH.value = h;
    setupEditorGrid(w, h); status('已新建 '+w+'×'+h+' 空地板');
  };

  // 保存/载入/删除
  S.DOM.save.onclick = saveLevel;
  S.DOM.load.onclick = ()=>{ if(S.DOM.saved.value) loadLevel(S.DOM.saved.value); };
  S.DOM.saved?.addEventListener('change', ()=>{ updateLevelHUD(); });
  S.DOM.del.onclick = ()=>{
    const key = S.DOM.saved?.value; if (!key) { status('没有选中要删除的关卡'); return; }
    if (!confirm(`确认删除关卡“${key}”吗？`)) return;
    deleteLevel(key); refreshSavedList(); updateLevelHUD();
    if (S.DOM.saved.options.length) { S.DOM.saved.selectedIndex = 0; loadLevel(S.DOM.saved.value); }
  };

  // 导出/导入
  S.DOM.exportBtn.onclick = ()=>{ const data=exportAllLevelsBundle(false); S.DOM.jsonText.value=stringifyLevelsBundlePretty(data); S.DOM.jsonModal.style.display='flex'; };
  S.DOM.closeJson.onclick = ()=> S.DOM.jsonModal.style.display='none';
  S.DOM.copyJson.onclick = async()=>{ try{ await navigator.clipboard.writeText(S.DOM.jsonText.value); status('JSON 已复制'); }catch{ S.DOM.jsonText.select(); document.execCommand('copy'); status('已尝试复制'); } };
  S.DOM.loadFromText.onclick = ()=>{ try{ const obj=JSON.parse(S.DOM.jsonText.value); if(importLevelsFromObject(obj)) S.DOM.jsonModal.style.display='none'; } catch(e){ alert('JSON 解析失败：'+e.message); } };
  S.DOM.downloadJson.onclick=()=>{ const blob=new Blob([S.DOM.jsonText.value],{type:'application/json'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=(S.DOM.levelName.value||'levels')+'.json'; a.click(); URL.revokeObjectURL(a.href); };
  S.DOM.importBtn.onclick=()=>S.DOM.importFile.click();
  S.DOM.importFile.onchange=(e)=>{ const f=e.target.files[0]; if(!f) return; const rd=new FileReader(); rd.onload=()=>{ try{ const obj=JSON.parse(rd.result); importLevelsFromObject(obj); }catch(err){ alert('JSON 格式不正确'); } }; rd.readAsText(f); };

  // 失败/死亡/清空缓存
  S.DOM.retry.onclick = resetAfterLose;
  S.DOM.deadOk.onclick = ()=>{ S.DOM.deadModal.style.display='none'; S.inputLocked=false; setupPlay(false); };
  S.DOM.clearCache.onclick=()=>{ try{ localStorage.removeItem('slidepaint-autosave-v2'); status('已清空自动备份'); if(S.DOM.clearModal) S.DOM.clearModal.style.display='flex'; }catch(e){ alert('清空失败：'+e.message); } };
  S.DOM.clearOk.onclick=()=>{ if(S.DOM.clearModal) S.DOM.clearModal.style.display='none'; };

  // 道具工具
  S.DOM.toolTeleport.onclick = ()=>{ const paid=payOrUse('teleport', S.toolPrices.teleport); if(!paid) return; const ok=useTeleport(); if(!ok) refundPay('teleport', paid); };
  S.DOM.toolUndo.onclick     = ()=>{ const paid=payOrUse('undo', S.toolPrices.undo); if(!paid) return; const ok=useUndo();     if(!ok) refundPay('undo', paid); };
  S.DOM.toolShuffle.onclick  = ()=>{ const paid=payOrUse('shuffle', S.toolPrices.shuffle); if(!paid) return; const ok=useShuffle();  if(!ok) refundPay('shuffle', paid); };
  S.DOM.toolSlot.onclick     = ()=>{ const paid=payOrUse('addslot', S.toolPrices.addslot); if(!paid) return; const ok=useAddSlot();   if(!ok) refundPay('addslot', paid); };

  // 通关 → 下一关
  S.DOM.winOk.onclick=()=>{
    S.DOM.winModal.style.display='none'; S.inputLocked=false;
    const sel=S.DOM.saved; if(!sel||!sel.options.length){ alert('没有新的关卡了'); return; }
    const i=Math.max(0, sel.selectedIndex);
    if(i+1<sel.options.length){ sel.selectedIndex=i+1; loadLevel(sel.value); updateLevelHUD(); S.DOM.mode.value='play'; applyModeUI(); }
    else alert('没有新的关卡了');
  };
}
