import React, { useState, useEffect } from "react";
import adminApi, { AdminKnowledgeArticle } from "../../services/adminApi";
import { RichContentEditor } from "../RichContentEditor";

const DEFAULT_VISUAL_TICKETS = [
  {
    title: "1. Tuyến cáp Vân Sơn (Lên đỉnh núi)",
    titleEn: "1. Van Son Cable Route (To the Peak)",
    titleKm: "1. ខ្សែកាប Vân Sơn (ឡើងកំពូលភ្នំ)",
    items: [
      { name: "Vé khứ hồi người lớn", nameEn: "Adult Round-trip", nameKm: "សំបុត្រទៅមកសម្រាប់មនុស្សពេញវ័យ", price: "400.000 VNĐ", priceEn: "400,000 VND", priceKm: "400.000 VNĐ" },
      { name: "Vé khứ hồi trẻ em (1m - 1m4)", nameEn: "Child Round-trip (1m - 1m4)", nameKm: "សំបុត្រទៅមកសម្រាប់កុមារ (1m - 1m4)", price: "300.000 VNĐ", priceEn: "300,000 VND", priceKm: "300.000 VNĐ" },
      { name: "Trẻ em dưới 1m", nameEn: "Child under 1m", nameKm: "កុមារកម្ពស់ក្រោម 1m", price: "Miễn phí", priceEn: "Free", priceKm: "ឥតគិតថ្លៃ" }
    ]
  },
  {
    title: "2. Tuyến cáp Chùa Hang (Lên Chùa Bà)",
    titleEn: "2. Chua Hang Cable Route (To Ba Temple)",
    titleKm: "2. ខ្សែកាប Chùa Hang (ឡើង Chùa Bà)",
    items: [
      { name: "Vé khứ hồi người lớn", nameEn: "Adult Round-trip", nameKm: "សំបុត្រទៅមកសម្រាប់មនុស្សពេញវ័យ", price: "250.000 VNĐ", priceEn: "250,000 VND", priceKm: "250.000 VNĐ", priceOneway: "150.000 VNĐ", priceOnewayEn: "150,000 VND", priceOnewayKm: "150.000 VNĐ" },
      { name: "Vé khứ hồi trẻ em (1m - 1m4)", nameEn: "Child Round-trip (1m - 1m4)", nameKm: "សំបុត្រទៅមកសម្រាប់កុមារ (1m - 1m4)", price: "150.000 VNĐ", priceEn: "150,000 VND", priceKm: "150.000 VNĐ", priceOneway: "100.000 VNĐ", priceOnewayEn: "100,000 VND", priceOnewayKm: "100.000 VNĐ" }
    ]
  },
  {
    title: "3. Combo Vé Đỉnh + Vé Chùa (Tất cả các tuyến)",
    titleEn: "3. Peak + Temple Combo Ticket (All Lines)",
    titleKm: "3. សំបុត្ររួម កំពូលភ្នំ + វត្ត (គ្រប់ខ្សែទាំងអស់)",
    items: [
      { name: "Người lớn", nameEn: "Adult", nameKm: "មនុស្សពេញវ័យ", price: "600.000 VNĐ", priceEn: "600,000 VND", priceKm: "600.000 VNĐ" },
      { name: "Trẻ em (1m - 1m4)", nameEn: "Child (1m - 1m4)", nameKm: "កុមារ (1m - 1m4)", price: "400.000 VNĐ", priceEn: "400,000 VND", priceKm: "400.000 VNĐ" }
    ]
  },
  {
    title: "4. Combo Vé Đỉnh + Vé Chùa + Buffet (Tất cả các tuyến)",
    titleEn: "4. Peak + Temple + Buffet Combo Ticket (All Lines)",
    titleKm: "4. សំបុត្ររួម កំពូលភ្នំ + វត្ត + ប៊ូហ្វេ (គ្រប់ខ្សែទាំងអស់)",
    items: [
      { name: "Người lớn", nameEn: "Adult", nameKm: "มนุษย์ពេញវ័យ", price: "800.000 VNĐ", priceEn: "800,000 VND", priceKm: "800.000 VNĐ" },
      { name: "Trẻ em (1m - 1m4)", nameEn: "Child (1m - 1m4)", nameKm: "កុមារ (1m - 1m4)", price: "600.000 VNĐ", priceEn: "600,000 VND", priceKm: "600.000 VNĐ" }
    ]
  }
];

const DEFAULT_VISUAL_SCHEDULES = [
  {
    title: "Tuyến đỉnh Vân Sơn",
    titleEn: "Van Son Peak Route",
    titleKm: "ខ្សែទៅកំពូលភ្នំ Vân Sơn",
    items: [
      { label: "Thứ 2 - Thứ 6", labelEn: "Monday - Friday", labelKm: "ថ្ងៃចន្ទ - ថ្ងៃសុក្រ", hours: "07:00 - 18:00", hoursEn: "07:00 - 18:00", hoursKm: "07:00 - 18:00", note: "", noteEn: "", noteKm: "" },
      { label: "Thứ 7 - Chủ Nhật", labelEn: "Saturday - Sunday", labelKm: "ថ្ងៃសៅរ៍ - ថ្ងៃអាទិត្យ", hours: "06:00 - 21:00", hoursEn: "06:00 - 21:00", hoursKm: "06:00 - 21:00", note: "(ngắm đèn LED đỉnh núi ban đêm)", noteEn: "(night LED light show)", noteKm: "(ទស្សនាការសម្តែងភ្លើង LED នៅកំពូលភ្នំនាពេលរាត្រី)" }
    ]
  },
  {
    title: "Tuyến Chùa Hang",
    titleEn: "Chua Hang Route",
    titleKm: "ខ្សែ Chùa Hang",
    items: [
      { label: "Thứ 2 - Thứ 6", labelEn: "Monday - Friday", labelKm: "ថ្ងៃចន្ទ - ថ្ងៃសុក្រ", hours: "06:00 - 18:00", hoursEn: "06:00 - 18:00", hoursKm: "06:00 - 18:00", note: "", noteEn: "", noteKm: "" },
      { label: "Thứ 7 - Chủ Nhật", labelEn: "Saturday - Sunday", labelKm: "ថ្ងៃសៅរ៍ - ថ្ងៃអាទិត្យ", hours: "05:30 - 22:00", hoursEn: "05:30 - 22:00", hoursKm: "05:30 - 22:00", note: "", noteEn: "", noteKm: "" }
    ]
  },
  {
    title: "Khu vực đền Chùa Bà",
    titleEn: "Ba Temple Area",
    titleKm: "តំបន់ Chùa Bà",
    items: [
      { label: "Hằng ngày", labelEn: "Daily", labelKm: "រាល់ថ្ងៃ", hours: "06:00 - 22:00", hoursEn: "06:00 - 22:00", hoursKm: "06:00 - 22:00", note: "", noteEn: "", noteKm: "" }
    ]
  }
];

interface ArticleModalProps {
  onClose: () => void;
  onSave: (data: { 
    title: string; 
    category: string; 
    content: string; 
    is_published: boolean; 
    title_en?: string; 
    content_en?: string;
    title_km?: string;
    content_km?: string;
  }) => void;
  selectedItem: AdminKnowledgeArticle | null;
  modalType: "add" | "edit" | null;
  defaultCategory?: string;
}

export const ArticleModal: React.FC<ArticleModalProps> = ({
  onClose,
  onSave,
  selectedItem,
  modalType,
  defaultCategory,
}) => {
  const [artTitle, setArtTitle] = useState("");
  const [artTitleEn, setArtTitleEn] = useState("");
  const [artTitleKm, setArtTitleKm] = useState("");
  const [artCategory, setArtCategory] = useState("lich_su");
  const [artContent, setArtContent] = useState("");
  const [artContentEn, setArtContentEn] = useState("");
  const [artContentKm, setArtContentKm] = useState("");
  const [artPublished, setArtPublished] = useState(true);
  const [translatingAll, setTranslatingAll] = useState(false);

  const [visualTickets, setVisualTickets] = useState<any[]>(DEFAULT_VISUAL_TICKETS);
  const [visualSchedules, setVisualSchedules] = useState<any[]>(DEFAULT_VISUAL_SCHEDULES);
  const [translatingTicketField, setTranslatingTicketField] = useState<string | null>(null);
  const [translatingField, setTranslatingField] = useState<string | null>(null);

  // Initialize form fields
  useEffect(() => {
    if (selectedItem) {
      setArtTitle(selectedItem.title || "");
      setArtTitleEn(selectedItem.title_en || "");
      setArtTitleKm(selectedItem.title_km || "");
      setArtCategory(selectedItem.category || defaultCategory || "lich_su");
      setArtContent(selectedItem.content || "");
      setArtContentEn(selectedItem.content_en || "");
      setArtContentKm(selectedItem.content_km || "");
      setArtPublished(selectedItem.is_published !== undefined ? selectedItem.is_published : true);
      
      if (selectedItem.category === "ve_va_gio_mo_cua") {
        try {
          const c = selectedItem.content?.trim();
          const cEn = selectedItem.content_en?.trim();
          const cKm = selectedItem.content_km?.trim();

          let parsedBase: any = null;
          let parsedEn: any = null;
          let parsedKm: any = null;

          if (c && (c.startsWith("[") || c.startsWith("{"))) {
            parsedBase = JSON.parse(c);
          }
          if (cEn && (cEn.startsWith("[") || cEn.startsWith("{"))) {
            parsedEn = JSON.parse(cEn);
          }
          if (cKm && (cKm.startsWith("[") || cKm.startsWith("{"))) {
            parsedKm = JSON.parse(cKm);
          }

          const baseTickets = parsedBase ? (Array.isArray(parsedBase) ? parsedBase : parsedBase.tickets) : null;
          const enTickets = parsedEn ? (Array.isArray(parsedEn) ? parsedEn : parsedEn.tickets) : null;
          const kmTickets = parsedKm ? (Array.isArray(parsedKm) ? parsedKm : parsedKm.tickets) : null;

          const baseSchedules = parsedBase && !Array.isArray(parsedBase) ? parsedBase.schedules : null;
          const enSchedules = parsedEn && !Array.isArray(parsedEn) ? parsedEn.schedules : null;
          const kmSchedules = parsedKm && !Array.isArray(parsedKm) ? parsedKm.schedules : null;

          // Merge tickets
          let mergedTickets = JSON.parse(JSON.stringify(DEFAULT_VISUAL_TICKETS));
          if (Array.isArray(baseTickets) && baseTickets.length > 0) {
            mergedTickets = JSON.parse(JSON.stringify(baseTickets));
          }

          mergedTickets.forEach((ticket: any, tIdx: number) => {
            if (!ticket.titleEn && enTickets && enTickets[tIdx]) {
              ticket.titleEn = enTickets[tIdx].titleEn || enTickets[tIdx].title;
            }
            if (!ticket.titleKm && kmTickets && kmTickets[tIdx]) {
              ticket.titleKm = kmTickets[tIdx].titleKm || kmTickets[tIdx].title;
            }

            if (Array.isArray(ticket.items)) {
              ticket.items.forEach((item: any, iIdx: number) => {
                const enItem = enTickets && enTickets[tIdx] && enTickets[tIdx].items ? enTickets[tIdx].items[iIdx] : null;
                const kmItem = kmTickets && kmTickets[tIdx] && kmTickets[tIdx].items ? kmTickets[tIdx].items[iIdx] : null;

                if (!item.nameEn && enItem) {
                  item.nameEn = enItem.nameEn || enItem.name;
                }
                if (!item.nameKm && kmItem) {
                  item.nameKm = kmItem.nameKm || kmItem.name;
                }

                if (!item.priceEn && enItem) {
                  item.priceEn = enItem.priceEn || enItem.price;
                }
                if (!item.priceKm && kmItem) {
                  item.priceKm = kmItem.priceKm || kmItem.price;
                }

                if (!item.priceOnewayEn && enItem) {
                  item.priceOnewayEn = enItem.priceOnewayEn || enItem.priceOneway;
                }
                if (!item.priceOnewayKm && kmItem) {
                  item.priceOnewayKm = kmItem.priceOnewayKm || kmItem.priceOneway;
                }
              });
            }
          });

          // Merge schedules
          let mergedSchedules = JSON.parse(JSON.stringify(DEFAULT_VISUAL_SCHEDULES));
          if (Array.isArray(baseSchedules) && baseSchedules.length > 0) {
            mergedSchedules = JSON.parse(JSON.stringify(baseSchedules));
          }

          mergedSchedules.forEach((sched: any, sIdx: number) => {
            if (!sched.titleEn && enSchedules && enSchedules[sIdx]) {
              sched.titleEn = enSchedules[sIdx].titleEn || enSchedules[sIdx].title;
            }
            if (!sched.titleKm && kmSchedules && kmSchedules[sIdx]) {
              sched.titleKm = kmSchedules[sIdx].titleKm || kmSchedules[sIdx].title;
            }

            if (Array.isArray(sched.items)) {
              sched.items.forEach((item: any, iIdx: number) => {
                const enItem = enSchedules && enSchedules[sIdx] && enSchedules[sIdx].items ? enSchedules[sIdx].items[iIdx] : null;
                const kmItem = kmSchedules && kmSchedules[sIdx] && kmSchedules[sIdx].items ? kmSchedules[sIdx].items[iIdx] : null;

                if (!item.labelEn && enItem) {
                  item.labelEn = enItem.labelEn || enItem.label;
                }
                if (!item.labelKm && kmItem) {
                  item.labelKm = kmItem.labelKm || kmItem.label;
                }

                if (!item.hoursEn && enItem) {
                  item.hoursEn = enItem.hoursEn || enItem.hours;
                }
                if (!item.hoursKm && kmItem) {
                  item.hoursKm = kmItem.hoursKm || kmItem.hours;
                }

                if (!item.noteEn && enItem) {
                  item.noteEn = enItem.noteEn || enItem.note;
                }
                if (!item.noteKm && kmItem) {
                  item.noteKm = kmItem.noteKm || kmItem.note;
                }
              });
            }
          });

          setVisualTickets(mergedTickets);
          setVisualSchedules(mergedSchedules);
        } catch (err) {
          console.error("Failed to parse visual tickets/schedules JSON", err);
          setVisualTickets(JSON.parse(JSON.stringify(DEFAULT_VISUAL_TICKETS)));
          setVisualSchedules(JSON.parse(JSON.stringify(DEFAULT_VISUAL_SCHEDULES)));
        }
      }
    } else {
      const cat = defaultCategory || "lich_su";
      setArtTitle("");
      setArtTitleEn("");
      setArtTitleKm("");
      setArtCategory(cat);
      setArtContent("");
      setArtContentEn("");
      setArtContentKm("");
      setArtPublished(true);
      
      if (cat === "ve_va_gio_mo_cua") {
        setVisualTickets(JSON.parse(JSON.stringify(DEFAULT_VISUAL_TICKETS)));
        setVisualSchedules(JSON.parse(JSON.stringify(DEFAULT_VISUAL_SCHEDULES)));
        setArtContent(JSON.stringify({
          tickets: DEFAULT_VISUAL_TICKETS,
          schedules: DEFAULT_VISUAL_SCHEDULES
        }, null, 2));
      }
    }
  }, [modalType, selectedItem, defaultCategory]);

  const syncTicketsToContent = (tickets: any[], schedules = visualSchedules) => {
    setArtContent(JSON.stringify({ tickets, schedules }, null, 2));
  };

  const updateVisualTickets = (updated: any[]) => {
    setVisualTickets(updated);
    syncTicketsToContent(updated);
  };

  const updateVisualSchedules = (updated: any[]) => {
    setVisualSchedules(updated);
    syncTicketsToContent(visualTickets, updated);
  };

  const handleTranslateTicketField = async (sIdx: number, field: "titleEn" | "nameEn" | "priceEn" | "priceOnewayEn" | "titleKm" | "nameKm" | "priceKm" | "priceOnewayKm", iIdx?: number) => {
    const key = `${sIdx}-${field}-${iIdx ?? ""}`;
    setTranslatingTicketField(key);
    try {
      let sourceText = "";
      if (field === "titleEn" || field === "titleKm") sourceText = visualTickets[sIdx]?.title || "";
      else if (field === "nameEn" || field === "nameKm") sourceText = visualTickets[sIdx]?.items[iIdx!]?.name || "";
      else if (field === "priceEn" || field === "priceKm") sourceText = visualTickets[sIdx]?.items[iIdx!]?.price || "";
      else if (field === "priceOnewayEn" || field === "priceOnewayKm") sourceText = visualTickets[sIdx]?.items[iIdx!]?.priceOneway || "";
      
      if (!sourceText) return;
      const targetLang = field.endsWith("Km") ? "km" : "en";
      const res = await adminApi.translateText(sourceText, targetLang);
      const updated = JSON.parse(JSON.stringify(visualTickets));
      if (field === "titleEn" || field === "titleKm") {
        updated[sIdx][field] = res.translated_text;
      } else if (iIdx !== undefined) {
        updated[sIdx].items[iIdx][field] = res.translated_text;
      }
      updateVisualTickets(updated);
    } catch (e: any) {
      alert(e?.message || "Lỗi khi dịch tự động.");
    } finally {
      setTranslatingTicketField(null);
    }
  };

  const handleTranslateScheduleField = async (sIdx: number, field: "titleEn" | "labelEn" | "noteEn" | "titleKm" | "labelKm" | "noteKm", iIdx?: number) => {
    const key = `sched-${sIdx}-${field}-${iIdx ?? ""}`;
    setTranslatingTicketField(key);
    try {
      let sourceText = "";
      if (field === "titleEn" || field === "titleKm") sourceText = visualSchedules[sIdx]?.title || "";
      else if (field === "labelEn" || field === "labelKm") sourceText = visualSchedules[sIdx]?.items[iIdx!]?.label || "";
      else if (field === "noteEn" || field === "noteKm") sourceText = visualSchedules[sIdx]?.items[iIdx!]?.note || "";
      
      if (!sourceText) return;
      const targetLang = field.endsWith("Km") ? "km" : "en";
      const res = await adminApi.translateText(sourceText, targetLang);
      const updated = JSON.parse(JSON.stringify(visualSchedules));
      if (field === "titleEn" || field === "titleKm") {
        updated[sIdx][field] = res.translated_text;
      } else if (iIdx !== undefined) {
        updated[sIdx].items[iIdx][field] = res.translated_text;
      }
      updateVisualSchedules(updated);
    } catch (e: any) {
      alert(e?.message || "Lỗi khi dịch tự động.");
    } finally {
      setTranslatingTicketField(null);
    }
  };

  const handleTranslateGeneralField = async (field: "title" | "content" | "titleEn" | "contentEn" | "titleKm" | "contentKm") => {
    setTranslatingField(field);
    try {
      const isKm = field.endsWith("Km");
      const lang = isKm ? "km" : "en";
      const targetField = (field.startsWith("title")) ? "title" : "content";
      const sourceText = targetField === "title" ? artTitle : artContent;
      
      if (!sourceText) return;
      const res = await adminApi.translateText(sourceText, lang);
      if (field === "titleEn") {
        setArtTitleEn(res.translated_text);
      } else if (field === "titleKm") {
        setArtTitleKm(res.translated_text);
      } else if (field === "contentEn") {
        setArtContentEn(res.translated_text);
      } else if (field === "contentKm") {
        setArtContentKm(res.translated_text);
      }
    } catch (e: any) {
      alert(e?.message || "Lỗi khi dịch tự động.");
    } finally {
      setTranslatingField(null);
    }
  };

  const handleTranslateAll = async () => {
    if (!artTitle && !artContent) {
      alert("Vui lòng nhập tiêu đề hoặc nội dung tiếng Việt trước khi dịch!");
      return;
    }

    const isVeVaGioMoCua = artCategory === "ve_va_gio_mo_cua";
    let needsTranslation = !artTitleEn || !artTitleKm;

    if (isVeVaGioMoCua) {
      if (visualTickets && visualTickets.length > 0) {
        for (const ticket of visualTickets) {
          if (!ticket.titleEn || !ticket.titleKm) {
            needsTranslation = true;
            break;
          }
          if (ticket.items) {
            for (const it of ticket.items) {
              if (!it.nameEn || !it.nameKm || !it.priceEn || !it.priceKm || (it.priceOneway && (!it.priceOnewayEn || !it.priceOnewayKm))) {
                needsTranslation = true;
                break;
              }
            }
          }
        }
      }
      if (visualSchedules && visualSchedules.length > 0) {
        for (const sched of visualSchedules) {
          if (!sched.titleEn || !sched.titleKm) {
            needsTranslation = true;
            break;
          }
          if (sched.items) {
            for (const it of sched.items) {
              if (!it.labelEn || !it.labelKm || (it.note && (!it.noteEn || !it.noteKm))) {
                needsTranslation = true;
                break;
              }
            }
          }
        }
      }
    } else {
      if (!artContentEn || !artContentKm) {
        needsTranslation = true;
      }
    }

    if (!needsTranslation) {
      alert("Tất cả các trường đã được dịch đầy đủ, không cần dịch thêm!");
      return;
    }

    let payload: any = {};
    if (isVeVaGioMoCua) {
      payload = {
        title: artTitle,
        titleEn: artTitleEn,
        titleKm: artTitleKm,
        tickets: visualTickets,
        schedules: visualSchedules
      };
    } else {
      payload = {
        title: artTitle,
        titleEn: artTitleEn,
        titleKm: artTitleKm,
        content: artContent,
        contentEn: artContentEn,
        contentKm: artContentKm
      };
    }

    setTranslatingAll(true);
    try {
      const res = await adminApi.translateText(JSON.stringify(payload), "both");
      const resObj = JSON.parse(res.translated_text);
      
      if (resObj.titleEn) setArtTitleEn(resObj.titleEn);
      if (resObj.titleKm) setArtTitleKm(resObj.titleKm);
      
      if (isVeVaGioMoCua) {
        if (resObj.tickets) setVisualTickets(resObj.tickets);
        if (resObj.schedules) setVisualSchedules(resObj.schedules);
        syncTicketsToContent(resObj.tickets || visualTickets, resObj.schedules || visualSchedules);
      } else {
        if (resObj.contentEn) setArtContentEn(resObj.contentEn);
        if (resObj.contentKm) setArtContentKm(resObj.contentKm);
      }
    } catch (e: any) {
      console.error(e);
      alert(e?.message || "Lỗi khi dịch tự động toàn bộ bằng AI.");
    } finally {
      setTranslatingAll(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const isVeVaGioMoCua = artCategory === "ve_va_gio_mo_cua";
    onSave({
      title: artTitle,
      category: artCategory,
      content: artContent,
      is_published: artPublished,
      title_en: artTitleEn,
      content_en: isVeVaGioMoCua ? artContent : artContentEn,
      title_km: artTitleKm,
      content_km: isVeVaGioMoCua ? artContent : artContentKm
    });
  };

  return (
    <div className="modal-content" style={{ maxWidth: artCategory === "ve_va_gio_mo_cua" ? "1080px" : "800px", width: "95vw" }}>
      <header className="modal-header">
        <h3>
          {artCategory === "ve_va_gio_mo_cua"
            ? (modalType === "add" ? "🎫 Thêm bảng giá vé mới" : "🎫 Chỉnh sửa bảng giá vé")
            : (modalType === "add" ? "📝 Thêm bài viết tri thức RAG" : "📝 Chỉnh sửa bài viết tri thức RAG")}
        </h3>
        <button type="button" className="btn btn-secondary btn-xs" onClick={onClose}>✕</button>
      </header>
      <form onSubmit={handleSubmit}>
        <div className="modal-body">
          {/* Centralized AI Translation Banner */}
          <div style={{
            background: "linear-gradient(135deg, rgba(11,37,69,0.05) 0%, rgba(212,163,89,0.1) 100%)",
            border: "1px solid rgba(212,163,89,0.3)",
            borderRadius: "8px",
            padding: "12px 16px",
            marginBottom: "16px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
            gap: "12px"
          }}>
            <div>
              <h4 style={{ margin: 0, color: "var(--primary-navy)", fontSize: "13px", fontWeight: 700 }}>✨ Trợ lý Dịch thuật AI Đa ngôn ngữ (EN & KM)</h4>
              <p style={{ margin: "2px 0 0 0", color: "#475569", fontSize: "11px", lineHeight: "1.4" }}>
                Nhấn dịch để tự động chuyển ngữ các phần trống sang Tiếng Anh & Khmer. Thông tin đã nhập tay sẽ được giữ nguyên.
              </p>
            </div>
            <button
              type="button"
              className="btn"
              style={{
                background: "linear-gradient(135deg, var(--primary-navy) 0%, #1e293b 100%)",
                border: "1px solid var(--accent-gold)",
                color: "var(--accent-gold)",
                padding: "6px 14px",
                borderRadius: "6px",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s",
                whiteSpace: "nowrap"
              }}
              disabled={translatingAll}
              onClick={handleTranslateAll}
            >
              {translatingAll ? "⏳ Đang dịch AI..." : "🚀 Dịch AI (EN & KM)"}
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginBottom: "12px" }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Tiêu đề bài viết (Tiếng Việt)</label>
              <input 
                type="text" 
                className="form-input" 
                required 
                value={artTitle} 
                onChange={e => setArtTitle(e.target.value)} 
              />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                <label className="form-label" style={{ margin: 0 }}>Tiêu đề bài viết (English)</label>
                <button type="button" className="btn btn-secondary btn-xs" style={{ padding: "1px 6px", fontSize: "10px" }}
                  disabled={translatingField === "titleEn"}
                  onClick={() => handleTranslateGeneralField("titleEn")}>
                  {translatingField === "titleEn" ? "..." : "AI Dịch"}
                </button>
              </div>
              <input 
                type="text" 
                className="form-input" 
                value={artTitleEn} 
                onChange={e => setArtTitleEn(e.target.value)} 
              />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                <label className="form-label" style={{ margin: 0 }}>Tiêu đề bài viết (Khmer)</label>
                <button type="button" className="btn btn-secondary btn-xs" style={{ padding: "1px 6px", fontSize: "10px" }}
                  disabled={translatingField === "titleKm"}
                  onClick={() => handleTranslateGeneralField("titleKm")}>
                  {translatingField === "titleKm" ? "..." : "AI Dịch"}
                </button>
              </div>
              <input 
                type="text" 
                className="form-input" 
                value={artTitleKm} 
                onChange={e => setArtTitleKm(e.target.value)} 
              />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Phân mục tri thức</label>
            <select 
              className="form-select" 
              value={artCategory} 
              onChange={e => {
                const cat = e.target.value;
                setArtCategory(cat);
                if (cat === "ve_va_gio_mo_cua") {
                  setVisualTickets(JSON.parse(JSON.stringify(DEFAULT_VISUAL_TICKETS)));
                  setVisualSchedules(JSON.parse(JSON.stringify(DEFAULT_VISUAL_SCHEDULES)));
                  syncTicketsToContent(DEFAULT_VISUAL_TICKETS, DEFAULT_VISUAL_SCHEDULES);
                }
              }}
            >
              <option value="ve_va_gio_mo_cua">🎫 Giá vé & Lịch hoạt động (Visual Builder)</option>
              <option value="di_chuyen">📍 Di chuyển & Đỗ xe (RAG Context)</option>
              <option value="noi_quy">🛡️ Nội quy chiêm bái & Trang phục (RAG Context)</option>
              <option value="lich_su">📖 Sự tích & Lịch sử (RAG Context)</option>
            </select>
          </div>

          {/* ===== VISUAL TICKET BUILDER (only for ve_va_gio_mo_cua) ===== */}
          {artCategory === "ve_va_gio_mo_cua" ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ background: "rgba(11,37,69,0.06)", borderRadius: "8px", padding: "12px 16px", border: "1px solid rgba(11,37,69,0.12)", fontSize: "12.5px", color: "var(--primary-navy)", fontWeight: 600 }}>
                ✏️ <strong>Trình soạn thảo bảng giá trực quan</strong> — Thay đổi sẽ tự động đồng bộ sang Zalo Mini App ngay lập tức sau khi lưu.
              </div>

              {visualTickets.map((section, sIdx) => (
                <div key={sIdx} style={{ border: "1.5px solid var(--border-slate)", borderRadius: "10px", overflow: "hidden" }}>
                  {/* Section header */}
                  <div style={{ background: "var(--primary-navy)", padding: "10px 14px", display: "flex", alignItems: "center", gap: "8px", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--accent-gold)", fontWeight: 700, fontSize: "13px" }}>Tuyến / Loại vé #{sIdx + 1}</span>
                    <div style={{ display: "flex", gap: "6px" }}>
                      {sIdx > 0 && (
                        <button type="button" style={{ background: "rgba(255,255,255,0.15)", border: "none", color: "white", borderRadius: "4px", padding: "2px 8px", cursor: "pointer", fontSize: "12px" }}
                          onClick={() => {
                            const u = JSON.parse(JSON.stringify(visualTickets));
                            [u[sIdx - 1], u[sIdx]] = [u[sIdx], u[sIdx - 1]];
                            updateVisualTickets(u);
                          }}>↑</button>
                      )}
                      {sIdx < visualTickets.length - 1 && (
                        <button type="button" style={{ background: "rgba(255,255,255,0.15)", border: "none", color: "white", borderRadius: "4px", padding: "2px 8px", cursor: "pointer", fontSize: "12px" }}
                          onClick={() => {
                            const u = JSON.parse(JSON.stringify(visualTickets));
                            [u[sIdx], u[sIdx + 1]] = [u[sIdx + 1], u[sIdx]];
                            updateVisualTickets(u);
                          }}>↓</button>
                      )}
                      <button type="button" style={{ background: "rgba(220,38,38,0.7)", border: "none", color: "white", borderRadius: "4px", padding: "2px 8px", cursor: "pointer", fontSize: "12px" }}
                        onClick={() => {
                          if (visualTickets.length <= 1) return;
                          const u = visualTickets.filter((_, i) => i !== sIdx);
                          updateVisualTickets(u);
                        }}>Xóa tuyến</button>
                    </div>
                  </div>

                  <div style={{ padding: "14px", display: "flex", flexDirection: "column", gap: "10px" }}>
                    {/* Section titles VI, EN, KM */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label" style={{ fontSize: "11.5px" }}>Tên tuyến (Tiếng Việt)</label>
                        <input type="text" className="form-input" value={section.title || ""}
                          onChange={e => { const u = JSON.parse(JSON.stringify(visualTickets)); u[sIdx].title = e.target.value; updateVisualTickets(u); }} />
                      </div>
                      <div className="form-group" style={{ margin: 0 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <label className="form-label" style={{ fontSize: "11.5px" }}>Tên tuyến (English)</label>
                          <button type="button" className="btn btn-secondary btn-xs" style={{ padding: "1px 6px", fontSize: "10px" }}
                            disabled={translatingTicketField === `${sIdx}-titleEn-`}
                            onClick={() => handleTranslateTicketField(sIdx, "titleEn")}>
                            {translatingTicketField === `${sIdx}-titleEn-` ? "..." : "AI Dịch"}
                          </button>
                        </div>
                        <input type="text" className="form-input" value={section.titleEn || ""}
                          onChange={e => { const u = JSON.parse(JSON.stringify(visualTickets)); u[sIdx].titleEn = e.target.value; updateVisualTickets(u); }} />
                      </div>
                      <div className="form-group" style={{ margin: 0 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <label className="form-label" style={{ fontSize: "11.5px" }}>Tên tuyến (Khmer)</label>
                          <button type="button" className="btn btn-secondary btn-xs" style={{ padding: "1px 6px", fontSize: "10px" }}
                            disabled={translatingTicketField === `${sIdx}-titleKm-`}
                            onClick={() => handleTranslateTicketField(sIdx, "titleKm")}>
                            {translatingTicketField === `${sIdx}-titleKm-` ? "..." : "AI Dịch"}
                          </button>
                        </div>
                        <input type="text" className="form-input" value={section.titleKm || ""}
                          onChange={e => { const u = JSON.parse(JSON.stringify(visualTickets)); u[sIdx].titleKm = e.target.value; updateVisualTickets(u); }} />
                      </div>
                    </div>

                    {/* Items table */}
                    <div style={{ background: "#f8fafc", borderRadius: "6px", overflowX: "auto", border: "1px solid var(--border-slate)" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px", minWidth: "800px" }}>
                        <thead>
                          <tr style={{ background: "rgba(11,37,69,0.05)", borderBottom: "1px solid var(--border-slate)" }}>
                            <th style={{ padding: "6px 6px", textAlign: "left", fontWeight: 700 }}>Đối tượng (VI)</th>
                            <th style={{ padding: "6px 6px", textAlign: "left", fontWeight: 700 }}>Đối tượng (EN)</th>
                            <th style={{ padding: "6px 6px", textAlign: "left", fontWeight: 700 }}>Đối tượng (KM)</th>
                            <th style={{ padding: "6px 6px", textAlign: "left", fontWeight: 700 }}>Giá khứ hồi (VNĐ)</th>
                            <th style={{ padding: "6px 6px", textAlign: "left", fontWeight: 700 }}>Giá một chiều (VNĐ)</th>
                            <th style={{ padding: "6px 4px", width: "36px" }}></th>
                          </tr>
                        </thead>
                        <tbody>
                          {section.items.map((item: any, iIdx: number) => (
                            <tr key={iIdx} style={{ borderTop: iIdx > 0 ? "1px solid var(--border-slate)" : "none" }}>
                              <td style={{ padding: "6px 4px" }}>
                                <input type="text" style={{ width: "100%", border: "1px solid #d1d5db", borderRadius: "4px", padding: "3px 6px", fontSize: "11px" }}
                                  value={item.name || ""}
                                  onChange={e => { const u = JSON.parse(JSON.stringify(visualTickets)); u[sIdx].items[iIdx].name = e.target.value; updateVisualTickets(u); }} />
                              </td>
                              <td style={{ padding: "6px 4px" }}>
                                <div style={{ display: "flex", gap: "2px", alignItems: "center" }}>
                                  <input type="text" style={{ flex: 1, minWidth: "60px", border: "1px solid #d1d5db", borderRadius: "4px", padding: "3px 4px", fontSize: "11px" }}
                                    value={item.nameEn || ""}
                                    onChange={e => { const u = JSON.parse(JSON.stringify(visualTickets)); u[sIdx].items[iIdx].nameEn = e.target.value; updateVisualTickets(u); }} />
                                  <button type="button" style={{ background: "var(--primary-navy)", color: "white", border: "none", borderRadius: "3px", padding: "2px 4px", cursor: "pointer", fontSize: "9px" }}
                                    disabled={translatingTicketField === `${sIdx}-nameEn-${iIdx}`}
                                    onClick={() => handleTranslateTicketField(sIdx, "nameEn", iIdx)}>
                                    {translatingTicketField === `${sIdx}-nameEn-${iIdx}` ? "..." : "Dịch"}
                                  </button>
                                </div>
                              </td>
                              <td style={{ padding: "6px 4px" }}>
                                <div style={{ display: "flex", gap: "2px", alignItems: "center" }}>
                                  <input type="text" style={{ flex: 1, minWidth: "60px", border: "1px solid #d1d5db", borderRadius: "4px", padding: "3px 4px", fontSize: "11px" }}
                                    value={item.nameKm || ""}
                                    onChange={e => { const u = JSON.parse(JSON.stringify(visualTickets)); u[sIdx].items[iIdx].nameKm = e.target.value; updateVisualTickets(u); }} />
                                  <button type="button" style={{ background: "var(--primary-navy)", color: "white", border: "none", borderRadius: "3px", padding: "2px 4px", cursor: "pointer", fontSize: "9px" }}
                                    disabled={translatingTicketField === `${sIdx}-nameKm-${iIdx}`}
                                    onClick={() => handleTranslateTicketField(sIdx, "nameKm", iIdx)}>
                                    {translatingTicketField === `${sIdx}-nameKm-${iIdx}` ? "..." : "Dịch"}
                                  </button>
                                </div>
                              </td>
                              <td style={{ padding: "6px 4px" }}>
                                <input type="text" style={{ width: "100%", border: "1px solid #d1d5db", borderRadius: "4px", padding: "3px 6px", fontSize: "11px" }}
                                  value={item.price || ""}
                                  onChange={e => { 
                                    const u = JSON.parse(JSON.stringify(visualTickets)); 
                                    u[sIdx].items[iIdx].price = e.target.value; 
                                    u[sIdx].items[iIdx].priceEn = e.target.value; 
                                    u[sIdx].items[iIdx].priceKm = e.target.value; 
                                    updateVisualTickets(u); 
                                  }} />
                              </td>
                              <td style={{ padding: "6px 4px" }}>
                                <input type="text" placeholder="(tùy chọn)" style={{ width: "100%", border: "1px solid #d1d5db", borderRadius: "4px", padding: "3px 6px", fontSize: "11px" }}
                                  value={item.priceOneway || ""}
                                  onChange={e => { 
                                    const u = JSON.parse(JSON.stringify(visualTickets)); 
                                    u[sIdx].items[iIdx].priceOneway = e.target.value; 
                                    u[sIdx].items[iIdx].priceOnewayEn = e.target.value; 
                                    u[sIdx].items[iIdx].priceOnewayKm = e.target.value; 
                                    updateVisualTickets(u); 
                                  }} />
                              </td>
                              <td style={{ padding: "4px" }}>
                                <button type="button" style={{ background: "rgba(220,38,38,0.7)", border: "none", color: "white", borderRadius: "3px", padding: "2px 6px", cursor: "pointer", fontSize: "11px" }}
                                  onClick={() => {
                                    const u = JSON.parse(JSON.stringify(visualTickets));
                                    u[sIdx].items = u[sIdx].items.filter((_: any, i: number) => i !== iIdx);
                                    updateVisualTickets(u);
                                  }}>✕</button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <button type="button" className="btn btn-secondary btn-xs" style={{ alignSelf: "flex-start" }}
                      onClick={() => {
                        const u = JSON.parse(JSON.stringify(visualTickets));
                        u[sIdx].items.push({ name: "", nameEn: "", nameKm: "", price: "", priceEn: "", priceKm: "", priceOneway: "", priceOnewayEn: "", priceOnewayKm: "" });
                        updateVisualTickets(u);
                      }}>
                      + Thêm loại vé vào tuyến này
                    </button>
                  </div>
                </div>
              ))}

              <button type="button" className="btn btn-secondary" style={{ alignSelf: "flex-start" }}
                onClick={() => {
                  const u = JSON.parse(JSON.stringify(visualTickets));
                  u.push({ title: "", titleEn: "", titleKm: "", items: [{ name: "", nameEn: "", nameKm: "", price: "", priceEn: "", priceKm: "", priceOneway: "", priceOnewayEn: "", priceOnewayKm: "" }] });
                  updateVisualTickets(u);
                }}>
                + Thêm tuyến / loại vé mới
              </button>

              <div style={{ background: "rgba(11,37,69,0.06)", borderRadius: "8px", padding: "12px 16px", border: "1px solid rgba(11,37,69,0.12)", fontSize: "12.5px", color: "var(--primary-navy)", fontWeight: 600 }}>
                <strong>Lịch hoạt động hiển thị trên Mini App</strong> - cập nhật tại đây, không cần sửa code frontend.
              </div>

              {visualSchedules.map((section, sIdx) => (
                <div key={sIdx} style={{ border: "1.5px solid var(--border-slate)", borderRadius: "10px", overflow: "hidden" }}>
                  <div style={{ background: "var(--primary-navy)", padding: "10px 14px", display: "flex", alignItems: "center", gap: "8px", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--accent-gold)", fontWeight: 700, fontSize: "13px" }}>Lịch hoạt động #{sIdx + 1}</span>
                    <button type="button" style={{ background: "rgba(220,38,38,0.7)", border: "none", color: "white", borderRadius: "4px", padding: "2px 8px", cursor: "pointer", fontSize: "12px" }}
                      onClick={() => {
                        if (visualSchedules.length <= 1) return;
                        updateVisualSchedules(visualSchedules.filter((_, i) => i !== sIdx));
                      }}>Xóa mục</button>
                  </div>
                  <div style={{ padding: "14px", display: "flex", flexDirection: "column", gap: "10px" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label" style={{ fontSize: "11.5px" }}>Tên tuyến/khu vực (VI)</label>
                        <input type="text" className="form-input" value={section.title || ""}
                          onChange={e => { const u = JSON.parse(JSON.stringify(visualSchedules)); u[sIdx].title = e.target.value; updateVisualSchedules(u); }} />
                      </div>
                      <div className="form-group" style={{ margin: 0 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <label className="form-label" style={{ fontSize: "11.5px" }}>Tên tuyến/khu vực (EN)</label>
                          <button type="button" className="btn btn-secondary btn-xs" style={{ padding: "1px 6px", fontSize: "10px" }}
                            disabled={translatingTicketField === `sched-${sIdx}-titleEn-`}
                            onClick={() => handleTranslateScheduleField(sIdx, "titleEn")}>
                            {translatingTicketField === `sched-${sIdx}-titleEn-` ? "..." : "AI Dịch"}
                          </button>
                        </div>
                        <input type="text" className="form-input" value={section.titleEn || ""}
                          onChange={e => { const u = JSON.parse(JSON.stringify(visualSchedules)); u[sIdx].titleEn = e.target.value; updateVisualSchedules(u); }} />
                      </div>
                      <div className="form-group" style={{ margin: 0 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <label className="form-label" style={{ fontSize: "11.5px" }}>Tên tuyến/khu vực (KM)</label>
                          <button type="button" className="btn btn-secondary btn-xs" style={{ padding: "1px 6px", fontSize: "10px" }}
                            disabled={translatingTicketField === `sched-${sIdx}-titleKm-`}
                            onClick={() => handleTranslateScheduleField(sIdx, "titleKm")}>
                            {translatingTicketField === `sched-${sIdx}-titleKm-` ? "..." : "AI Dịch"}
                          </button>
                        </div>
                        <input type="text" className="form-input" value={section.titleKm || ""}
                          onChange={e => { const u = JSON.parse(JSON.stringify(visualSchedules)); u[sIdx].titleKm = e.target.value; updateVisualSchedules(u); }} />
                      </div>
                    </div>
                    <div style={{ background: "#f8fafc", borderRadius: "6px", overflowX: "auto", border: "1px solid var(--border-slate)" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px", minWidth: "960px" }}>
                        <thead>
                          <tr style={{ background: "rgba(11,37,69,0.05)", borderBottom: "1px solid var(--border-slate)" }}>
                            <th style={{ padding: "6px 10px", textAlign: "left", fontWeight: 700 }}>Ngày/khung (VI)</th>
                            <th style={{ padding: "6px 10px", textAlign: "left", fontWeight: 700 }}>Ngày/khung (EN)</th>
                            <th style={{ padding: "6px 10px", textAlign: "left", fontWeight: 700 }}>Ngày/khung (KM)</th>
                            <th style={{ padding: "6px 10px", textAlign: "left", fontWeight: 700 }}>Giờ</th>
                            <th style={{ padding: "6px 10px", textAlign: "left", fontWeight: 700 }}>Ghi chú (VI)</th>
                            <th style={{ padding: "6px 10px", textAlign: "left", fontWeight: 700 }}>Note (EN)</th>
                            <th style={{ padding: "6px 10px", textAlign: "left", fontWeight: 700 }}>Note (KM)</th>
                            <th style={{ padding: "6px 4px", width: "36px" }}></th>
                          </tr>
                        </thead>
                        <tbody>
                          {(section.items || []).map((item: any, iIdx: number) => (
                            <tr key={iIdx} style={{ borderTop: iIdx > 0 ? "1px solid var(--border-slate)" : "none" }}>
                              <td style={{ padding: "6px 8px" }}>
                                <input type="text" style={{ width: "100%", border: "1px solid #d1d5db", borderRadius: "4px", padding: "3px 6px", fontSize: "11px" }} value={item.label || ""}
                                  onChange={e => { const u = JSON.parse(JSON.stringify(visualSchedules)); u[sIdx].items[iIdx].label = e.target.value; updateVisualSchedules(u); }} />
                              </td>
                              <td style={{ padding: "6px 8px" }}>
                                <div style={{ display: "flex", gap: "2px", alignItems: "center" }}>
                                  <input type="text" style={{ flex: 1, border: "1px solid #d1d5db", borderRadius: "4px", padding: "3px 4px", fontSize: "11px" }} value={item.labelEn || ""}
                                    onChange={e => { const u = JSON.parse(JSON.stringify(visualSchedules)); u[sIdx].items[iIdx].labelEn = e.target.value; updateVisualSchedules(u); }} />
                                  <button type="button" style={{ background: "var(--primary-navy)", color: "white", border: "none", borderRadius: "3px", padding: "2px 4px", cursor: "pointer", fontSize: "9px" }}
                                    disabled={translatingTicketField === `sched-${sIdx}-labelEn-${iIdx}`}
                                    onClick={() => handleTranslateScheduleField(sIdx, "labelEn", iIdx)}>
                                    {translatingTicketField === `sched-${sIdx}-labelEn-${iIdx}` ? "..." : "D"}
                                  </button>
                                </div>
                              </td>
                              <td style={{ padding: "6px 8px" }}>
                                <div style={{ display: "flex", gap: "2px", alignItems: "center" }}>
                                  <input type="text" style={{ flex: 1, border: "1px solid #d1d5db", borderRadius: "4px", padding: "3px 4px", fontSize: "11px" }} value={item.labelKm || ""}
                                    onChange={e => { const u = JSON.parse(JSON.stringify(visualSchedules)); u[sIdx].items[iIdx].labelKm = e.target.value; updateVisualSchedules(u); }} />
                                  <button type="button" style={{ background: "var(--primary-navy)", color: "white", border: "none", borderRadius: "3px", padding: "2px 4px", cursor: "pointer", fontSize: "9px" }}
                                    disabled={translatingTicketField === `sched-${sIdx}-labelKm-${iIdx}`}
                                    onClick={() => handleTranslateScheduleField(sIdx, "labelKm", iIdx)}>
                                    {translatingTicketField === `sched-${sIdx}-labelKm-${iIdx}` ? "..." : "D"}
                                  </button>
                                </div>
                              </td>
                              <td style={{ padding: "6px 8px" }}>
                                <input type="text" placeholder="07:00 - 18:00" style={{ width: "100%", border: "1px solid #d1d5db", borderRadius: "4px", padding: "3px 6px", fontSize: "11px" }} value={item.hours || ""}
                                  onChange={e => { const u = JSON.parse(JSON.stringify(visualSchedules)); u[sIdx].items[iIdx].hours = e.target.value; u[sIdx].items[iIdx].hoursEn = e.target.value; u[sIdx].items[iIdx].hoursKm = e.target.value; updateVisualSchedules(u); }} />
                              </td>
                              <td style={{ padding: "6px 8px" }}>
                                <input type="text" style={{ width: "100%", border: "1px solid #d1d5db", borderRadius: "4px", padding: "3px 6px", fontSize: "11px" }} value={item.note || ""}
                                  onChange={e => { const u = JSON.parse(JSON.stringify(visualSchedules)); u[sIdx].items[iIdx].note = e.target.value; updateVisualSchedules(u); }} />
                              </td>
                              <td style={{ padding: "6px 8px" }}>
                                <div style={{ display: "flex", gap: "2px", alignItems: "center" }}>
                                  <input type="text" style={{ flex: 1, border: "1px solid #d1d5db", borderRadius: "4px", padding: "3px 4px", fontSize: "11px" }} value={item.noteEn || ""}
                                    onChange={e => { const u = JSON.parse(JSON.stringify(visualSchedules)); u[sIdx].items[iIdx].noteEn = e.target.value; updateVisualSchedules(u); }} />
                                  <button type="button" style={{ background: "var(--primary-navy)", color: "white", border: "none", borderRadius: "3px", padding: "2px 4px", cursor: "pointer", fontSize: "9px" }}
                                    disabled={translatingTicketField === `sched-${sIdx}-noteEn-${iIdx}`}
                                    onClick={() => handleTranslateScheduleField(sIdx, "noteEn", iIdx)}>
                                    {translatingTicketField === `sched-${sIdx}-noteEn-${iIdx}` ? "..." : "D"}
                                  </button>
                                </div>
                              </td>
                              <td style={{ padding: "6px 8px" }}>
                                <div style={{ display: "flex", gap: "2px", alignItems: "center" }}>
                                  <input type="text" style={{ flex: 1, border: "1px solid #d1d5db", borderRadius: "4px", padding: "3px 4px", fontSize: "11px" }} value={item.noteKm || ""}
                                    onChange={e => { const u = JSON.parse(JSON.stringify(visualSchedules)); u[sIdx].items[iIdx].noteKm = e.target.value; updateVisualSchedules(u); }} />
                                  <button type="button" style={{ background: "var(--primary-navy)", color: "white", border: "none", borderRadius: "3px", padding: "2px 4px", cursor: "pointer", fontSize: "9px" }}
                                    disabled={translatingTicketField === `sched-${sIdx}-noteKm-${iIdx}`}
                                    onClick={() => handleTranslateScheduleField(sIdx, "noteKm", iIdx)}>
                                    {translatingTicketField === `sched-${sIdx}-noteKm-${iIdx}` ? "..." : "D"}
                                  </button>
                                </div>
                              </td>
                              <td style={{ padding: "4px" }}>
                                <button type="button" style={{ background: "rgba(220,38,38,0.7)", border: "none", color: "white", borderRadius: "3px", padding: "2px 6px", cursor: "pointer", fontSize: "11px" }}
                                  onClick={() => {
                                    const u = JSON.parse(JSON.stringify(visualSchedules));
                                    u[sIdx].items = u[sIdx].items.filter((_: any, i: number) => i !== iIdx);
                                    updateVisualSchedules(u);
                                  }}>✕</button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <button type="button" className="btn btn-secondary btn-xs" style={{ alignSelf: "flex-start" }}
                      onClick={() => {
                        const u = JSON.parse(JSON.stringify(visualSchedules));
                        u[sIdx].items.push({ label: "", labelEn: "", labelKm: "", hours: "", hoursEn: "", hoursKm: "", note: "", noteEn: "", noteKm: "" });
                        updateVisualSchedules(u);
                      }}>
                      + Thêm khung giờ
                    </button>
                  </div>
                </div>
              ))}

              <button type="button" className="btn btn-secondary" style={{ alignSelf: "flex-start" }}
                onClick={() => {
                  const u = JSON.parse(JSON.stringify(visualSchedules));
                  u.push({ title: "", titleEn: "", titleKm: "", items: [{ label: "", labelEn: "", labelKm: "", hours: "", hoursEn: "", hoursKm: "", note: "", noteEn: "", noteKm: "" }] });
                  updateVisualSchedules(u);
                }}>
                + Thêm tuyến/khu vực lịch hoạt động
              </button>
              {/* Collapsible raw JSON for advanced use */}
              <details style={{ marginTop: "4px" }}>
                <summary style={{ cursor: "pointer", fontSize: "12px", color: "var(--text-light)", fontWeight: 600 }}>⚙️ Xem/Sửa JSON nâng cao (tự động đồng bộ)</summary>
                <textarea
                  className="form-textarea"
                  rows={8}
                  style={{ marginTop: "8px", fontSize: "11.5px", fontFamily: "monospace" }}
                  value={artContent}
                  onChange={e => {
                    setArtContent(e.target.value);
                    try {
                      const parsed = JSON.parse(e.target.value);
                      if (Array.isArray(parsed)) {
                        setVisualTickets(parsed);
                      } else {
                        if (Array.isArray(parsed.tickets)) setVisualTickets(parsed.tickets);
                        if (Array.isArray(parsed.schedules)) setVisualSchedules(parsed.schedules);
                      }
                    } catch { /* ignore */ }
                  }}
                />
              </details>
            </div>
          ) : (
            /* ===== PLAIN TEXT TEXTAREA for RAG articles with RichContentEditor ===== */
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div className="form-group" style={{ margin: 0 }}>
                <RichContentEditor
                  value={artContent}
                  onChange={setArtContent}
                  label="Nội dung chi tiết (Tiếng Việt - RAG Context)"
                  placeholder="Nhập nội dung văn bản tiếng Việt..."
                  lang="vi"
                />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <RichContentEditor
                  value={artContentEn}
                  onChange={setArtContentEn}
                  label="Nội dung chi tiết (English - Mini App Display)"
                  placeholder="Nhập nội dung văn bản tiếng Anh..."
                  lang="en"
                  onTranslate={() => handleTranslateGeneralField("contentEn")}
                  translating={translatingField === "contentEn"}
                />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <RichContentEditor
                  value={artContentKm}
                  onChange={setArtContentKm}
                  label="Nội dung chi tiết (Khmer - RAG Context / Mini App)"
                  placeholder="Nhập nội dung văn bản tiếng Khmer..."
                  lang="km"
                  onTranslate={() => handleTranslateGeneralField("contentKm")}
                  translating={translatingField === "contentKm"}
                />
              </div>
            </div>
          )}

          <div className="form-group" style={{ flexDirection: "row", gap: "8px", alignItems: "center" }}>
            <input 
              type="checkbox" 
              id="art_pub" 
              checked={artPublished} 
              onChange={e => setArtPublished(e.target.checked)} 
            />
            <label htmlFor="art_pub" className="form-label" style={{ margin: 0, cursor: "pointer" }}>
              Đăng tải lên hệ thống tra cứu công khai
            </label>
          </div>
        </div>
        <footer className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>Hủy</button>
          <button type="submit" className="btn btn-primary">
            {modalType === "add" ? "Tạo & Lập chỉ mục Vector" : "Lưu thay đổi"}
          </button>
        </footer>
      </form>
    </div>
  );
};
