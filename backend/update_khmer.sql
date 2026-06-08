-- Update tickets and schedules JSON content + Khmer translations
UPDATE knowledge_articles
SET content_km = '{
  "tickets": [
    {
      "title": "Vé vào cổng (Mua riêng cáp treo)",
      "titleEn": "Admission ticket (Cable car ticket sold separately)",
      "titleKm": "សំបុត្រចូលទស្សនា (ទិញសំបុត្ររថយន្តខ្សែកាបដាច់ដោយឡែក)",
      "items": [
        {
          "name": "Người lớn",
          "nameEn": "Adult",
          "price": "10.000 VNĐ",
          "priceEn": "10.000 VNĐ",
          "priceOneway": "",
          "nameKm": "មនុស្សពេញវ័យ",
          "priceKm": "10.000 ដុង"
        },
        {
          "name": "Trẻ em (1m - 1m4)",
          "nameEn": "Child (1m - 1m4)",
          "price": "5.000 VNĐ",
          "priceEn": "5.000 VNĐ",
          "priceOneway": "",
          "nameKm": "កុមារ (1ម - 1.4ម)",
          "priceKm": "5.000 ដុង"
        },
        {
          "name": "Trẻ em dưới 1m",
          "nameEn": "Child under 1m",
          "price": "Miễn phí",
          "priceEn": "Free",
          "priceOneway": "",
          "nameKm": "កុមារក្រោម 1ម",
          "priceKm": "ឥតគិតថ្លៃ"
        }
      ]
    },
    {
      "title": "1. Tuyến cáp Vân Sơn (Lên đỉnh núi)",
      "titleEn": "1. Van Son Cable Route (To the Peak)",
      "titleKm": "1. ខ្សែរថយន្តខ្សែកាបវ៉ាន់សឺន (ឡើងដល់កំពូលភ្នំ)",
      "items": [
        {
          "name": "Vé khứ hồi người lớn",
          "nameEn": "Adult Round-trip",
          "price": "400.000 VNĐ",
          "priceEn": "400,000 VND",
          "nameKm": "សំបុត្រទៅមកមនុស្សពេញវ័យ",
          "priceKm": "400.000 ដុង"
        },
        {
          "name": "Vé khứ hồi trẻ em (1m - 1m4)",
          "nameEn": "Child Round-trip (1m - 1m4)",
          "price": "300.000 VNĐ",
          "priceEn": "300,000 VND",
          "nameKm": "សំបុត្រទៅមកកុមារ (1ម - 1.4ម)",
          "priceKm": "300.000 ដុង"
        },
        {
          "name": "Trẻ em dưới 1m",
          "nameEn": "Child under 1m",
          "price": "Miễn phí",
          "priceEn": "Free",
          "nameKm": "កុមារក្រោម 1ម",
          "priceKm": "ឥតគិតថ្លៃ"
        }
      ]
    },
    {
      "title": "2. Tuyến cáp Chùa Hang (Lên Chùa Bà)",
      "titleEn": "2. Chua Hang Cable Route (To Ba Temple)",
      "titleKm": "2. ខ្សែរថយន្តខ្សែកាបវត្តហាង (ឡើងទៅវត្តបា)",
      "items": [
        {
          "name": "Vé khứ hồi người lớn",
          "nameEn": "Adult Round-trip",
          "price": "250.000 VNĐ",
          "priceEn": "250,000 VND",
          "priceOneway": "150.000 VNĐ",
          "priceOnewayEn": "150,000 VND",
          "nameKm": "សំបុត្រទៅមកមនុស្សពេញវ័យ",
          "priceKm": "250.000 ដុង",
          "priceOnewayKm": "150.000 ដុង"
        },
        {
          "name": "Vé khứ hồi trẻ em (1m - 1m4)",
          "nameEn": "Child Round-trip (1m - 1m4)",
          "price": "150.000 VNĐ",
          "priceEn": "150,000 VND",
          "priceOneway": "100.000 VNĐ",
          "priceOnewayEn": "100,000 VND",
          "nameKm": "សំបុត្រទៅមកកុមារ (1ម - 1.4ម)",
          "priceKm": "150.000 ដុង",
          "priceOnewayKm": "100.000 ដុង"
        }
      ]
    },
    {
      "title": "3. Combo Vé Đỉnh + Vé Chùa (Tất cả các tuyến)",
      "titleEn": "3. Peak + Temple Combo Ticket (All Lines)",
      "titleKm": "3. កញ្ចប់សំបុត្រកំពូលភ្នំ + សំបុត្រវត្ត (គ្រប់ខ្សែ)",
      "items": [
        {
          "name": "Người lớn",
          "nameEn": "Adult",
          "price": "600.000 VNĐ",
          "priceEn": "600,000 VND",
          "nameKm": "មនុស្សពេញវ័យ",
          "priceKm": "600.000 ដុង"
        },
        {
          "name": "Trẻ em (1m - 1m4)",
          "nameEn": "Child (1m - 1m4)",
          "price": "400.000 VNĐ",
          "priceEn": "400,000 VND",
          "nameKm": "កុមារ (1ម - 1.4ម)",
          "priceKm": "400.000 ដុង"
        }
      ]
    },
    {
      "title": "4. Combo Vé Đỉnh + Vé Chùa + Buffet (Tất cả các tuyến)",
      "titleEn": "4. Peak + Temple + Buffet Combo Ticket (All Lines)",
      "titleKm": "4. កញ្ចប់សំបុត្រកំពូលភ្នំ + សំបុត្រវត្ត + ប៊ូហ្វេ (គ្រប់ខ្សែ)",
      "items": [
        {
          "name": "Người lớn",
          "nameEn": "Adult",
          "price": "800.000 VNĐ",
          "priceEn": "800,000 VND",
          "nameKm": "មនុស្សពេញវ័យ",
          "priceKm": "800.000 ដុង"
        },
        {
          "name": "Trẻ em (1m - 1m4)",
          "nameEn": "Child (1m - 1m4)",
          "price": "600.000 VNĐ",
          "priceEn": "600,000 VND",
          "nameKm": "កុមារ (1ម - 1.4ម)",
          "priceKm": "600.000 ដុង"
        }
      ]
    },
    {
      "title": "5. Vé máng trượt",
      "titleEn": "5. Slide ticket",
      "titleKm": "5. សំបុត្ររអិល",
      "items": [
        {
          "name": "Người lớn",
          "nameEn": "Adult",
          "price": "150.000 VNĐ",
          "priceEn": "150.000 VNĐ",
          "priceOneway": "",
          "nameKm": "មនុស្សពេញវ័យ",
          "priceKm": "150.000 ដុង"
        },
        {
          "name": "Trẻ em (1m - 1m4)",
          "nameEn": "Child (1m - 1m4)",
          "price": "100.000 VNĐ",
          "priceEn": "100.000 VNĐ",
          "priceOneway": "",
          "nameKm": "កុមារ (1ម - 1.4ម)",
          "priceKm": "100.000 ដុង"
        }
      ]
    }
  ],
  "schedules": [
    {
      "title": "Tuyến Đỉnh Vân Sơn",
      "titleEn": "Van Son Peak Route",
      "titleKm": "ខ្សែរថយន្តខ្សែកាបកំពូលភ្នំវ៉ាន់សឺន",
      "items": [
        {
          "label": "Thứ 2 - Thứ 6",
          "labelEn": "Monday - Friday",
          "hours": "07:00 - 18:00",
          "hoursEn": "07:00 - 18:00",
          "note": "",
          "noteEn": "",
          "labelKm": "ថ្ងៃច័ន្ទ - ថ្ងៃសុក្រ",
          "hoursKm": "07:00 - 18:00",
          "noteKm": ""
        },
        {
          "label": "Thứ 7 - Chủ Nhật",
          "labelEn": "Saturday - Sunday",
          "hours": "06:00 - 21:00",
          "hoursEn": "06:00 - 21:00",
          "note": "Ngắm led đỉnh núi ban đêm",
          "noteEn": "(night LED light show)",
          "labelKm": "ថ្ងៃសៅរ៍ - ថ្ងៃអាទិត្យ",
          "hoursKm": "06:00 - 21:00",
          "noteKm": "ទស្សនាពន្លឺ LED លើកំពូលភ្នំពេលយប់"
        }
      ]
    },
    {
      "title": "Tuyến Chùa Hang ( Khu vực Chùa Bà - Điện Bà)",
      "titleEn": "Chua Hang Route",
      "titleKm": "ខ្សែរថយន្តខ្សែកាបវត្តហាង (តំបន់វត្តបា - ឌៀនបា)",
      "items": [
        {
          "label": "Thứ 2 - Thứ 6",
          "labelEn": "Monday - Friday",
          "hours": "06:00 - 18:00",
          "hoursEn": "06:00 - 18:00",
          "note": "",
          "noteEn": "",
          "labelKm": "ថ្ងៃច័ន្ទ - ថ្ងៃសុក្រ",
          "hoursKm": "06:00 - 18:00",
          "noteKm": ""
        },
        {
          "label": "Thứ 7 - Chủ Nhật",
          "labelEn": "Saturday - Sunday",
          "hours": "05:30 - 22:00",
          "hoursEn": "05:30 - 22:00",
          "note": "",
          "noteEn": "",
          "labelKm": "ថ្ងៃសៅរ៍ - ថ្ងៃអាទិត្យ",
          "hoursKm": "05:30 - 22:00",
          "noteKm": ""
        }
      ]
    },
    {
      "title": "Tuyến Tâm An ( Kết nối Đỉnh núi và Chùa Bà)",
      "titleEn": "Ba Temple Area",
      "titleKm": "ខ្សែរថយន្តខ្សែកាបតាមអាន (តភ្ជាប់កំពូលភ្នំ និងវត្តបា)",
      "items": [
        {
          "label": "Thứ 2 - Thứ 6",
          "labelEn": "Monday - Friday",
          "hours": "",
          "hoursEn": "",
          "note": "Đóng cửa",
          "noteEn": "Closed",
          "labelKm": "ថ្ងៃច័ន្ទ - ថ្ងៃសុក្រ",
          "hoursKm": "",
          "noteKm": "បិទ"
        },
        {
          "label": "Thứ 7 - Chủ Nhật",
          "labelEn": "Saturday - Sunday",
          "hours": "06:00 - 19:00",
          "hoursEn": "06:00 - 19:00",
          "note": "",
          "noteEn": "",
          "labelKm": "ថ្ងៃសៅរ៍ - ថ្ងៃអាទិត្យ",
          "hoursKm": "06:00 - 19:00",
          "noteKm": ""
        }
      ]
    }
  ]
}',
    title_km = 'ព័ត៌មានតម្លៃសំបុត្រកាប៊ីនភ្នំបាដិន ឆ្នាំ២០២៦',
    title_en = 'Cable Car Ticket Information for Ba Den Mountain 2026'
WHERE id = 'a1c3d359-fe2c-42da-9d19-d94dfcedb021';

UPDATE knowledge_articles
SET content_km = '{
  "tickets": [
    {
      "title": "Vé vào cổng (Mua riêng cáp treo)",
      "titleEn": "Admission ticket (Cable car ticket sold separately)",
      "titleKm": "សំបុត្រចូលទស្សនា (ទិញសំបុត្ររថយន្តខ្សែកាបដាច់ដោយឡែក)",
      "items": [
        {
          "name": "Người lớn",
          "nameEn": "Adult",
          "price": "10.000 VNĐ",
          "priceEn": "10.000 VNĐ",
          "priceOneway": "",
          "nameKm": "មនុស្សពេញវ័យ",
          "priceKm": "10.000 ដុង"
        },
        {
          "name": "Trẻ em (1m - 1m4)",
          "nameEn": "Child (1m - 1m4)",
          "price": "5.000 VNĐ",
          "priceEn": "5.000 VNĐ",
          "priceOneway": "",
          "nameKm": "កុមារ (1ម - 1.4ម)",
          "priceKm": "5.000 ដុង"
        },
        {
          "name": "Trẻ em dưới 1m",
          "nameEn": "Child under 1m",
          "price": "Miễn phí",
          "priceEn": "Free",
          "priceOneway": "",
          "nameKm": "កុមារក្រោម 1ម",
          "priceKm": "ឥតគិតថ្លៃ"
        }
      ]
    },
    {
      "title": "1. Tuyến cáp Vân Sơn (Lên đỉnh núi)",
      "titleEn": "1. Van Son Cable Route (To the Peak)",
      "titleKm": "1. ខ្សែរថយន្តខ្សែកាបវ៉ាន់សឺន (ឡើងដល់កំពូលភ្នំ)",
      "items": [
        {
          "name": "Vé khứ hồi người lớn",
          "nameEn": "Adult Round-trip",
          "price": "400.000 VNĐ",
          "priceEn": "400,000 VND",
          "nameKm": "សំបុត្រទៅមកមនុស្សពេញវ័យ",
          "priceKm": "400.000 ដុង"
        },
        {
          "name": "Vé khứ hồi trẻ em (1m - 1m4)",
          "nameEn": "Child Round-trip (1m - 1m4)",
          "price": "300.000 VNĐ",
          "priceEn": "300,000 VND",
          "nameKm": "សំបុត្រទៅមកកុមារ (1ម - 1.4ម)",
          "priceKm": "300.000 ដុង"
        },
        {
          "name": "Trẻ em dưới 1m",
          "nameEn": "Child under 1m",
          "price": "Miễn phí",
          "priceEn": "Free",
          "nameKm": "កុមារក្រោម 1ម",
          "priceKm": "ឥតគិតថ្លៃ"
        }
      ]
    },
    {
      "title": "2. Tuyến cáp Chùa Hang (Lên Chùa Bà)",
      "titleEn": "2. Chua Hang Cable Route (To Ba Temple)",
      "titleKm": "2. ខ្សែរថយន្តខ្សែកាបវត្តហាង (ឡើងទៅវត្តបា)",
      "items": [
        {
          "name": "Vé khứ hồi người lớn",
          "nameEn": "Adult Round-trip",
          "price": "250.000 VNĐ",
          "priceEn": "250,000 VND",
          "priceOneway": "150.000 VNĐ",
          "priceOnewayEn": "150,000 VND",
          "nameKm": "សំបុត្រទៅមកមនុស្សពេញវ័យ",
          "priceKm": "250.000 ដុង",
          "priceOnewayKm": "150.000 ដុង"
        },
        {
          "name": "Vé khứ hồi trẻ em (1m - 1m4)",
          "nameEn": "Child Round-trip (1m - 1m4)",
          "price": "150.000 VNĐ",
          "priceEn": "150,000 VND",
          "priceOneway": "100.000 VNĐ",
          "priceOnewayEn": "100,000 VND",
          "nameKm": "សំបុត្រទៅមកកុមារ (1ម - 1.4ម)",
          "priceKm": "150.000 ដុង",
          "priceOnewayKm": "100.000 ដុង"
        }
      ]
    },
    {
      "title": "3. Combo Vé Đỉnh + Vé Chùa (Tất cả các tuyến)",
      "titleEn": "3. Peak + Temple Combo Ticket (All Lines)",
      "titleKm": "3. កញ្ចប់សំបុត្រកំពូលភ្នំ + សំបុត្រវត្ត (គ្រប់ខ្សែ)",
      "items": [
        {
          "name": "Người lớn",
          "nameEn": "Adult",
          "price": "600.000 VNĐ",
          "priceEn": "600,000 VND",
          "nameKm": "មនុស្សពេញវ័យ",
          "priceKm": "600.000 ដុង"
        },
        {
          "name": "Trẻ em (1m - 1m4)",
          "nameEn": "Child (1m - 1m4)",
          "price": "400.000 VNĐ",
          "priceEn": "400,000 VND",
          "nameKm": "កុមារ (1ម - 1.4ម)",
          "priceKm": "400.000 ដុង"
        }
      ]
    },
    {
      "title": "4. Combo Vé Đỉnh + Vé Chùa + Buffet (Tất cả các tuyến)",
      "titleEn": "4. Peak + Temple + Buffet Combo Ticket (All Lines)",
      "titleKm": "4. កញ្ចប់សំបុត្រកំពូលភ្នំ + សំបុត្រវត្ត + ប៊ូហ្វេ (គ្រប់ខ្សែ)",
      "items": [
        {
          "name": "Người lớn",
          "nameEn": "Adult",
          "price": "800.000 VNĐ",
          "priceEn": "800,000 VND",
          "nameKm": "មនុស្សពេញវ័យ",
          "priceKm": "800.000 ដុង"
        },
        {
          "name": "Trẻ em (1m - 1m4)",
          "nameEn": "Child (1m - 1m4)",
          "price": "600.000 VNĐ",
          "priceEn": "600,000 VND",
          "nameKm": "កុមារ (1ម - 1.4ម)",
          "priceKm": "600.000 ដុង"
        }
      ]
    },
    {
      "title": "5. Vé máng trượt",
      "titleEn": "5. Slide ticket",
      "titleKm": "5. សំបុត្ររអិល",
      "items": [
        {
          "name": "Người lớn",
          "nameEn": "Adult",
          "price": "150.000 VNĐ",
          "priceEn": "150.000 VNĐ",
          "priceOneway": "",
          "nameKm": "មនុស្សពេញវ័យ",
          "priceKm": "150.000 ដុង"
        },
        {
          "name": "Trẻ em (1m - 1m4)",
          "nameEn": "Child (1m - 1m4)",
          "price": "100.000 VNĐ",
          "priceEn": "100.000 VNĐ",
          "priceOneway": "",
          "nameKm": "កុមារ (1ម - 1.4ម)",
          "priceKm": "100.000 ដុង"
        }
      ]
    }
  ],
  "schedules": [
    {
      "title": "Tuyến Đỉnh Vân Sơn",
      "titleEn": "Van Son Peak Route",
      "titleKm": "ខ្សែរថយន្តខ្សែកាបកំពូលភ្នំវ៉ាន់សឺន",
      "items": [
        {
          "label": "Thứ 2 - Thứ 6",
          "labelEn": "Monday - Friday",
          "hours": "07:00 - 18:00",
          "hoursEn": "07:00 - 18:00",
          "note": "",
          "noteEn": "",
          "labelKm": "ថ្ងៃច័ន្ទ - ថ្ងៃសុក្រ",
          "hoursKm": "07:00 - 18:00",
          "noteKm": ""
        },
        {
          "label": "Thứ 7 - Chủ Nhật",
          "labelEn": "Saturday - Sunday",
          "hours": "06:00 - 21:00",
          "hoursEn": "06:00 - 21:00",
          "note": "Ngắm led đỉnh núi ban đêm",
          "noteEn": "(night LED light show)",
          "labelKm": "ថ្ងៃសៅរ៍ - ថ្ងៃអាទិត្យ",
          "hoursKm": "06:00 - 21:00",
          "noteKm": "ទស្សនាពន្លឺ LED លើកំពូលភ្នំពេលយប់"
        }
      ]
    },
    {
      "title": "Tuyến Chùa Hang ( Khu vực Chùa Bà - Điện Bà)",
      "titleEn": "Chua Hang Route",
      "titleKm": "ខ្សែរថយន្តខ្សែកាបវត្តហាង (តំបន់វត្តបា - ឌៀនបា)",
      "items": [
        {
          "label": "Thứ 2 - Thứ 6",
          "labelEn": "Monday - Friday",
          "hours": "06:00 - 18:00",
          "hoursEn": "06:00 - 18:00",
          "note": "",
          "noteEn": "",
          "labelKm": "ថ្ងៃច័ន្ទ - ថ្ងៃសុក្រ",
          "hoursKm": "06:00 - 18:00",
          "noteKm": ""
        },
        {
          "label": "Thứ 7 - Chủ Nhật",
          "labelEn": "Saturday - Sunday",
          "hours": "05:30 - 22:00",
          "hoursEn": "05:30 - 22:00",
          "note": "",
          "noteEn": "",
          "labelKm": "ថ្ងៃសៅរ៍ - ថ្ងៃអាទិត្យ",
          "hoursKm": "05:30 - 22:00",
          "noteKm": ""
        }
      ]
    },
    {
      "title": "Tuyến Tâm An ( Kết nối Đỉnh núi và Chùa Bà)",
      "titleEn": "Ba Temple Area",
      "titleKm": "ខ្សែរថយន្តខ្សែកាបតាមអាន (តភ្ជាប់កំពូលភ្នំ និងវត្តបា)",
      "items": [
        {
          "label": "Thứ 2 - Thứ 6",
          "labelEn": "Monday - Friday",
          "hours": "",
          "hoursEn": "",
          "note": "Đóng cửa",
          "noteEn": "Closed",
          "labelKm": "ថ្ងៃច័ន្ទ - ថ្ងៃសុក្រ",
          "hoursKm": "",
          "noteKm": "បិទ"
        },
        {
          "label": "Thứ 7 - Chủ Nhật",
          "labelEn": "Saturday - Sunday",
          "hours": "06:00 - 19:00",
          "hoursEn": "06:00 - 19:00",
          "note": "",
          "noteEn": "",
          "labelKm": "ថ្ងៃសៅរ៍ - ថ្ងៃអាទិត្យ",
          "hoursKm": "06:00 - 19:00",
          "noteKm": ""
        }
      ]
    }
  ]
}',
    title_km = 'ម៉ោងប្រតិបត្តិការលម្អិតនៃរមណីយដ្ឋានភ្នំបាដិន',
    title_en = 'Detailed Operating Hours of Ba Den Mountain Tourist Area'
WHERE id = 'a1c3d359-fe2c-42da-9d19-d94dfcedb022';

-- Update dress code and conduct
UPDATE knowledge_articles
SET title_km = 'បទប្បញ្ញត្តិ​សម្លៀកបំពាក់ និង​ក្រមសីលធម៌​សុជីវធម៌ ពេល​ទស្សនា​រមណីយដ្ឋាន​ប្រវត្តិសាស្ត្រ',
    content_km = 'នៅពេលមកគោរពបូជានៅតាមទីសក្ការៈបូជាដ៏ពិសិដ្ឋនៅភ្នំបាដេន (វត្តបា, ព្រះពន្លាបា, ព្រះពុទ្ធបដិមា) ភ្ញៀវទេសចរត្រូវតែអនុវត្តតាមបទប្បញ្ញត្តិស្ដីពីសម្លៀកបំពាក់ និងឥរិយាបថដូចខាងក្រោមនេះ:
១. អំពីសម្លៀកបំពាក់:
- ស្លៀកពាក់សមរម្យ និងជិតជិត។ ហាមស្លៀកពាក់អាវគ្មានដៃ អាវខ្សែពីរ ខោខ្លី សំពត់ខ្លីលើជង្គង់នៅពេលចូលព្រះវិហារ ឬទេវស្ថាន។
- ពាក់ស្បែកជើងសមរម្យ ងាយស្រួលធ្វើដំណើរព្រោះមានជណ្ដើរជាច្រើនកាំ និងចោត។

២. អំពីឥរិយាបថ និងសន្តិសុខសណ្ដាប់ធ្នាប់:
- រក្សាភាពស្ងៀមស្ងាត់ កុំនិយាយសើចខ្លាំងៗ លេងសើចនៅក្នុងបរិវេណគោរពបូជាដ៏ពិសិដ្ឋ។
- ហាមប៉ះពាល់វត្ថុបុរាណដោយគ្មានការអនុញ្ញាត ព្រះពុទ្ធបដិមា ឬគូរវាសផ្ដេសផ្ដាសលើជញ្ជាំងរូងភ្នំ។
- ហាមចោលសំរាមពាសវាលពាសកាល។ សូមបោះសំរាមនៅកន្លែងដែលបានកំណត់ ដើម្បីរក្សាអនាម័យទូទៅ និងទេសភាពភ្នំដ៏បៃតង។
- ហាមនាំសត្វចិញ្ចឹមចូលក្នុងបរិវេណទីសក្ការៈបូជាសាសនា។'
WHERE id = 'a1c3d359-fe2c-42da-9d19-d94dfcedb023';

-- Update transport guide
UPDATE knowledge_articles
SET title_km = 'របៀបធ្វើដំណើរពីទីក្រុងហូជីមិញទៅភ្នំបាដិន

ភ្នំបាដិន គឺជាគោលដៅទេសចរណ៍បែបសាសនា និងធម្មជាតិដ៏ល្បីល្បាញមួយនៅខេត្តតៃនិញ ប្រទេសវៀតណាម។ ជាមួយនឹងកម្ពស់ ៩៨៦ ម៉ែត្រ នេះគឺជាភ្នំខ្ពស់បំផុតនៅភាគខាងត្បូងប្រទេសវៀតណាម ដែលទាក់ទាញភ្ញៀវទេសចររាប់លាននាក់ជារៀងរាល់ឆ្នាំដោយសារសម្រស់ដ៏អស្ចារ្យ និងរឿងព្រេងនិទាន។

ប្រសិនបើអ្នកកំពុងមានគម្រោងទៅទស្សនាភ្នំបាដិនពីទីក្រុងហូជីមិញ ខាងក្រោមនេះគឺជាការណែនាំលម្អិតអំពីមធ្យោបាយធ្វើដំណើរដ៏ពេញនិយមបំផុត៖

**១. ម៉ូតូ (ប្រហែល ២-៣ ម៉ោង)៖**
នេះគឺជាជម្រើសដ៏ពេញនិយមសម្រាប់អ្នកដែលចូលចិត្តសេរីភាព និងចង់ស្វែងយល់ពីទេសភាពតាមផ្លូវ។
*   **ផ្លូវធ្វើដំណើរ៖** ពីទីក្រុងហូជីមិញ អ្នកអាចធ្វើដំណើរតាមបណ្ដោយផ្លូវជាតិលេខ ២២ ឆ្ពោះទៅកាន់ខេត្តតៃនិញ។ ពេលទៅដល់ផ្លូវបំបែកត្រាងបាង (Trảng Bàng) សូមបត់ស្តាំចូលផ្លូវជាតិលេខ ២២B។ បន្តទៅមុខត្រង់រហូតទាល់តែឃើញស្លាកសញ្ញាបង្ហាញផ្លូវទៅភ្នំបាដិន។
*   **ចំណាំ៖** ត្រូវប្រាកដថា ម៉ូតូរបស់អ្នកស្ថិតក្នុងស្ថានភាពល្អ មានឯកសារគ្រប់គ្រាន់ និងគោរពច្បាប់ចរាចរណ៍។

**២. រថយន្តក្រុង (ប្រហែល ២.៥-៣.៥ ម៉ោង)៖**
នេះគឺជាមធ្យោបាយធ្វើដំណើរប្រកបដោយសុវត្ថិភាព និងងាយស្រួល ស័ក្តិសមសម្រាប់ក្រុមមនុស្សច្រើន ឬអ្នកដែលមិនចង់បើកបរដោយខ្លួនឯង។
*   **ទីតាំងចេញដំណើរ៖** ចំណតរថយន្តក្រុងអានសឿង (An Sương) ឬចំណតរថយន្តក្រុងភាគខាងកើត (ថ្មី)។
*   **ក្រុមហ៊ុនរថយន្តក្រុង៖** មានក្រុមហ៊ុនរថយន្តក្រុងជាច្រើនដែលដំណើរការលើខ្សែផ្លូវទីក្រុងហូជីមិញ – តៃនិញ ដូចជា លេហៃ (Lê Hải), គីមង៉ាន់ (Kim Ngân), ដុងភឿក (Đồng Phước) ជាដើម។
*   **តម្លៃសំបុត្រ៖** ប្រហែល ៨០.០០០ – ១២០.០០០ ដុង/នាក់/ជើង។
*   **ទីតាំងទៅដល់៖** រថយន្តក្រុងជាធម្មតាឈប់នៅចំណតរថយន្តក្រុងតៃនិញ។ ពីទីនេះ អ្នកអាចជិះតាក់ស៊ី ម៉ូតូឌុប ឬរថយន្តក្រុងក្នុងស្រុកដើម្បីទៅដល់ភ្នំបាដិន (ប្រហែល ១៥-២០ នាទី)។

**៣. រថយន្តផ្ទាល់ខ្លួន/ជួលរថយន្ត (ប្រហែល ២-២.៥ ម៉ោង)៖**
ប្រសិនបើអ្នកធ្វើដំណើរជាក្រុមគ្រួសារ ឬមិត្តភក្តិ ការជួលរថយន្តឯកជនគឺជាជម្រើសដ៏ងាយស្រួល និងបត់បែន។
*   **ផ្លូវធ្វើដំណើរ៖** ស្រដៀងនឹងការធ្វើដំណើរដោយម៉ូតូដែរ គឺធ្វើដំណើរតាមបណ្ដោយផ្លូវជាតិលេខ ២២ និងផ្លូវជាតិលេខ ២២B។
*   **ចំណាំ៖** មានចំណតរថយន្តធំទូលាយនៅតំបន់ជើងភ្នំបាដិន។

**៤. តាក់ស៊ី/សេវាកម្មកក់រថយន្តតាមកម្មវិធី (ប្រហែល ២-២.៥ ម៉ោង)៖**
នេះគឺជាជម្រើសដ៏ងាយស្រួលបំផុត ប្រសិនបើអ្នកចង់ធ្វើដំណើរលឿន និងមិនបាច់បារម្ភពីការរកផ្លូវ។
*   **តម្លៃ៖** ប្រហែល ១.២០០.០០០ – ១.៥០០.០០០ ដុង/ជើង (អាស្រ័យលើប្រភេទរថយន្ត និងពេលវេលា)។
*   **ចំណាំ៖** គួរកក់រថយន្តជាមុន ឬប្រើប្រាស់កម្មវិធីកក់រថយន្តដែលមានកេរ្តិ៍ឈ្មោះល្អ ដើម្បីធានាតម្លៃ និងគុណភាពសេវាកម្ម។

**គន្លឹះបន្ថែម៖**
*   **ពេលវេលាសមស្រប៖** អ្នកគួរតែទៅនៅពេលព្រឹកព្រលឹម ដើម្បីជៀសវាងកម្ដៅថ្ងៃ និងមានពេលច្រើនដើម្បីស្វែងយល់។
*   **សម្លៀកបំពាក់៖** គួរតែស្លៀកពាក់ឱ្យបានស្រួល ពាក់ស្បែកជើងកីឡា ឬស្បែកជើងផ្ទាត់ ដើម្បីងាយស្រួលធ្វើដំណើរ និងឡើងភ្នំ។
*   **សម្ភារៈផ្ទាល់ខ្លួន៖** យកមួក ឡេការពារកម្ដៅថ្ងៃ ទឹកផឹក និងអាហារសម្រន់បន្តិចបន្តួចទៅជាមួយ។
*   **សំបុត្រកាប៊ីន/សំបុត្រចូលទ្វារ៖** អ្នកអាចទិញសំបុត្រនៅនឹងកន្លែង ឬកក់ទុកជាមុនតាមអនឡាញដើម្បីសន្សំសំចៃពេលវេលា។',
    content_km = 'ចម្ងាយពីទីក្រុងហូជីមិញទៅភ្នំបាដេន ១១០គីឡូម៉ែត្រ។ ជម្រើសធ្វើដំណើរ៖

១. ម៉ូតូ ឬឡានផ្ទាល់ខ្លួន៖
- ផ្លូវ៖ តាមផ្លូវជាតិលេខ ២២ ដល់ផ្លូវបំបែក Trang Bang បត់ស្តាំចូលផ្លូវខេត្ត ៧៨២ ឬត្រង់តាមផ្លូវជាតិលេខ ២២ ដល់ផ្លូវបំបែក Go Gau រួចតាមផ្លូវជាតិលេខ ២២B ចូលទីក្រុង Tay Ninh។ ពីទីក្រុង Tay Ninh ទៅ ១១គីឡូម៉ែត្រតាមផ្លូវ Bo Loi ដល់តំបន់ទេសចរណ៍។ ពេលវេលា៖ ២,៥ - ៣ម៉ោង។

២. រថយន្តក្រុង (Bus)៖
- ជិះខ្សែ TP.HCM - Tay Ninh ពីចំណត An Suong។ ដល់ចំណត Tay Ninh ជិះឡានក្រុងក្នុងខេត្ត ឬតាក់ស៊ីបន្តទៅភ្នំបាដេន។

៣. រថយន្តសេវាកម្ម (Limousine)៖
- ក្រុមហ៊ុនរត់ផ្ទាល់ TP.HCM - ភ្នំបាដេន ទទួល-បញ្ជូនដល់កន្លែង។ តម្លៃ៖ ១៥០.០០០ - ២០០.០០០ ដុង/ជើង។'
WHERE id = 'a1c3d359-fe2c-42da-9d19-d94dfcedb024';
