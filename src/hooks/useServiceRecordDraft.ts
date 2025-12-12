import { useState, useEffect, useCallback } from 'react';

interface PartUsed {
  inventoryItemId: string;
  quantity: number;
  itemName: string;
  unitPrice: number | null;
}

interface ServiceRecordDraft {
  formData: any;
  partsUsed: PartUsed[];
  savedAt: string;
  customerId: string;
}

const DRAFT_KEY_PREFIX = 'service_record_draft_';

export const useServiceRecordDraft = (customerId: string) => {
  const [hasDraft, setHasDraft] = useState(false);
  const [draftTimestamp, setDraftTimestamp] = useState<string | null>(null);

  const getDraftKey = useCallback(() => {
    return `${DRAFT_KEY_PREFIX}${customerId}`;
  }, [customerId]);

  // Check for existing draft on mount
  useEffect(() => {
    const draftKey = getDraftKey();
    const savedDraft = localStorage.getItem(draftKey);
    if (savedDraft) {
      try {
        const parsed: ServiceRecordDraft = JSON.parse(savedDraft);
        // Check if draft is less than 24 hours old
        const savedTime = new Date(parsed.savedAt).getTime();
        const now = Date.now();
        const hoursDiff = (now - savedTime) / (1000 * 60 * 60);
        
        if (hoursDiff < 24) {
          setHasDraft(true);
          setDraftTimestamp(parsed.savedAt);
        } else {
          // Draft is too old, clear it
          localStorage.removeItem(draftKey);
        }
      } catch (e) {
        localStorage.removeItem(draftKey);
      }
    }
  }, [getDraftKey]);

  // Check if form has meaningful data worth saving
  const hasFormData = useCallback((formData: any, partsUsed: PartUsed[]) => {
    // Check if any text fields have content
    const textFields = [
      formData.technician_name,
      formData.work_performed,
      formData.chemicals_added,
      formData.equipment_serviced,
      formData.customer_notes,
      formData.technician_notes,
      formData.total_time_minutes,
      formData.follow_up_notes,
    ];
    
    const hasTextContent = textFields.some(field => field && field.trim() !== '');
    const hasParts = partsUsed.length > 0;
    
    // Check if any readings have been entered
    const readingFields = ['before_readings', 'after_readings', 'spa_before_readings', 'spa_after_readings'];
    const hasReadings = readingFields.some(readingType => {
      const readings = formData[readingType];
      if (!readings) return false;
      return Object.values(readings).some(val => val && String(val).trim() !== '');
    });
    
    return hasTextContent || hasParts || hasReadings;
  }, []);

  const saveDraft = useCallback((formData: any, partsUsed: PartUsed[]) => {
    // Only save if there's meaningful data
    if (!hasFormData(formData, partsUsed)) {
      return;
    }
    
    const draftKey = getDraftKey();
    const draft: ServiceRecordDraft = {
      formData,
      partsUsed,
      savedAt: new Date().toISOString(),
      customerId,
    };
    localStorage.setItem(draftKey, JSON.stringify(draft));
    setHasDraft(true);
    setDraftTimestamp(draft.savedAt);
  }, [customerId, getDraftKey, hasFormData]);

  const loadDraft = useCallback((): { formData: any; partsUsed: PartUsed[] } | null => {
    const draftKey = getDraftKey();
    const savedDraft = localStorage.getItem(draftKey);
    if (savedDraft) {
      try {
        const parsed: ServiceRecordDraft = JSON.parse(savedDraft);
        return {
          formData: parsed.formData,
          partsUsed: parsed.partsUsed,
        };
      } catch (e) {
        return null;
      }
    }
    return null;
  }, [getDraftKey]);

  const clearDraft = useCallback(() => {
    const draftKey = getDraftKey();
    localStorage.removeItem(draftKey);
    setHasDraft(false);
    setDraftTimestamp(null);
  }, [getDraftKey]);

  const formatDraftTime = useCallback(() => {
    if (!draftTimestamp) return '';
    const date = new Date(draftTimestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    return date.toLocaleDateString();
  }, [draftTimestamp]);

  return {
    hasDraft,
    draftTimestamp,
    saveDraft,
    loadDraft,
    clearDraft,
    formatDraftTime,
  };
};
