# FX Trade Journal - Hướng dẫn thiết kế

## Triết lý thiết kế
FX Trade Journal hướng đến một thiết kế hiện đại, sang trọng và chuyên nghiệp, lấy cảm hứng từ thiết kế của Apple nhưng có phong cách riêng biệt phù hợp với lĩnh vực tài chính. Tất cả các yếu tố thiết kế đều tập trung vào việc tạo ra một trải nghiệm nhất quán, dễ sử dụng và đẹp mắt.

## Nguyên tắc thiết kế chung
- **Tính nhất quán cao**: Các trang phải có cấu trúc, phong cách và cách bố trí nhất quán.
- **Thiết kế gọn nhẹ**: Loại bỏ các yếu tố dư thừa, tập trung vào dữ liệu quan trọng.
- **Visual hierarchy**: Sử dụng kích thước, màu sắc và vị trí để tạo thứ bậc thông tin.
- **Micro-interactions**: Các hiệu ứng tinh tế khi hover, active để tạo trải nghiệm động.

## Màu sắc
Bảng màu chính của ứng dụng được thiết kế để truyền tải cảm giác chuyên nghiệp, đáng tin cậy nhưng vẫn hiện đại:

- **Primary**: Xanh đậm (#0074E4) - Màu chủ đạo, thể hiện sự chuyên nghiệp
- **Success**: Xanh lá (#10B981) - Dùng cho các giao dịch lời
- **Destructive**: Đỏ (#F43F5E) - Dùng cho các giao dịch lỗ
- **Warning**: Vàng (#F59E0B) - Dùng cho cảnh báo
- **Muted**: Xám nhạt (#64748B) - Dùng cho văn bản phụ
- **Background**: Gam màu trắng tinh khiết (#FFFFFF -> #F8FAFC)
- **Card**: Trắng với đổ bóng nhẹ
- **Border**: Đường viền mờ

## Typography
- **Font chính**: Inter - Font sans-serif hiện đại, dễ đọc
- **Heading**: Font-weight 600-700, line-height thấp, tracking-tight
- **Body**: Font-weight 400-500, line-height thoáng
- **Kích thước font**:
  - Heading 1: 1.875rem -> 3xl (30px) - Gradient text cho tiêu đề lớn
  - Heading 2: 1.5rem -> 2xl (24px) - Tiêu đề sections
  - Heading 3: 1.25rem -> xl (20px) - Tiêu đề card components
  - Body: 1rem (16px)
  - Small: 0.875rem (14px)
  - Tiny: 0.75rem (12px) - Dành cho meta data, labels nhỏ
- **Text effects**:
  - Sử dụng bg-gradient-to-r with bg-clip-text và text-transparent cho tiêu đề quan trọng
  - opacity-80/70 để giảm độ tương phản cho text thứ cấp thay vì text-muted

## Không gian và layout
- **Border radius**: 0.5rem (8px) cho hầu hết các thành phần, 9999px cho badge và pill buttons
- **Padding**: Nhất quán dựa trên bội số của 4px (0.25rem)
- **Margin**: Nhất quán dựa trên bội số của 4px
- **Gap**: Sử dụng 0.5rem (8px), 1rem (16px) và 1.5rem (24px) cho grid và flex
- **Layout**: Sử dụng grid cho cấu trúc lớn, flex cho các thành phần nhỏ hơn
- **Section Spacing**: Sử dụng 2rem (32px) giữa các section chính (mb-8)
- **Container**: max-w-7xl cho nội dung chính, mx-auto để căn giữa
- **Page Structure**: 
  - Tiêu đề trang / Header 
  - Section tiêu đề rõ ràng với icon
  - Nội dung phân nhóm theo grid layout
  - Các component có khoảng cách nhất quán

## Đổ bóng
- **Subtle**: 0 1px 2px rgba(0, 0, 0, 0.05)
- **Normal**: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.05)
- **Medium**: 0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.05)
- **Elevated**: 0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 10px 10px -5px rgba(0, 0, 0, 0.04)

## Biểu tượng và đồ họa
- **Icon**: Sử dụng Lucide Icons cho biểu tượng nhất quán
- **Icon size**: 
  - 16px (h-4 w-4) cho thông thường và UI elements nhỏ
  - 20px (h-5 w-5) cho feature icons và tiêu đề sections
  - 24px (h-6 w-6) cho empty states và biểu tượng nổi bật
- **Colors**: 
  - Biểu tượng trong tiêu đề section: text-primary/80
  - Biểu tượng trong buttons: kèm mr-2
  - Biểu tượng trong cards: có thể trong circle background (bg-primary/10)
  - Biểu tượng chức năng: tương ứng với ngữ cảnh (success, destructive...)
- **Empty States**: Sử dụng biểu tượng lớn mờ (opacity-20) để biểu thị trạng thái rỗng
- **Data Visualization**: Đơn giản, tối ưu tương phản, loại bỏ các yếu tố không cần thiết

## Component và Page patterns

### Buttons
- **Primary**: Màu nền primary, text màu trắng, border radius 0.5rem
- **Secondary**: Màu nền muted/10, text màu primary, border radius 0.5rem
- **Outline**: Viền mỏng, không có màu nền, border radius 0.5rem
- **Ghost**: Không có viền, không có màu nền, chỉ đổi màu khi hover
- **Kích thước**: sm, default, lg - nhất quán về padding và font-size
- **Icon + Text**: Icon trước text với mr-2, cân đối kích thước

### Page Headers
- **Main title**: Gradient text, text-3xl, font-bold, tracking-tight
- **Subtitle**: text-muted-foreground kích thước nhỏ hơn, mt-1
- **Flex layout**: flex flex-col md:flex-row md:items-center md:justify-between
- **Action area**: Buttons và filter controls nằm ở bên phải header
- **Time filter**: Select component với icon phù hợp

### Cards
- **Background**: Màu trắng hoặc rất nhạt, có thể có gradient nhẹ
- **Border**: Viền mỏng (border-border/30) hoặc không có viền, chỉ có shadow
- **Shadow**: Đổ bóng nhẹ (shadow-sm) để tạo chiều sâu, hover tăng nhẹ (shadow-md)
- **Layout**: Padding nhất quán 1.5rem, các thành phần bên trong có gap 1rem
- **Hiệu ứng**: Sử dụng group-hover để tạo hiệu ứng interactive, backdrop-blur nhẹ cho tooltip
- **Empty State**: Hiển thị trạng thái không có dữ liệu với biểu tượng nhạt và hướng dẫn

### Section Headers
- **Title**: text-lg font-semibold, flex items-center
- **Icon**: Lucide icon h-5 w-5 mr-2 text-primary/80
- **Margin**: mb-4 để tạo khoảng cách với nội dung
- **Text alignment**: Canh trái, cùng cấp độ với các section tiêu đề khác

### Data Visualization 
- **Charts**: Đơn giản, gọn nhẹ, không có legend không cần thiết
- **Colors**: Sử dụng palette màu nhất quán và có tính phân biệt
- **Axes**: Loại bỏ các axis nhẹ không cần thiết, giữ lại đường lưới mờ (opacity 0.1) nếu cần
- **Tooltip**: Custom tooltip để phù hợp với thiết kế chung
- **Empty States**: Thể hiện rõ ràng khi không có dữ liệu để hiển thị

### Input & Forms
- **Input**: Viền mỏng, padding vừa phải, focus có outline màu primary
- **Label**: Trên input, font-weight medium
- **Error**: Hiển thị lỗi với màu destructive bên dưới input
- **Placeholder**: Màu nhạt hơn so với text thông thường

### Dialogs & Modals
- **Background**: Màu trắng
- **Overlay**: Màu đen với opacity 0.4-0.5
- **Shadow**: Shadow lớn hơn so với cards
- **Animation**: Fade in và nhẹ nhàng scale up khi hiển thị

### Tables
- **Header**: Background nhẹ, font-weight medium
- **Rows**: Các dòng có màu nền xen kẽ nhẹ (striped) hoặc hover highlight
- **Border**: Đường viền mỏng phân tách các phần
- **Pagination**: Nhất quán với thiết kế button

## Responsive design
- **Mobile-first**: Thiết kế tối ưu cho mobile trước, sau đó mở rộng lên desktop
- **Breakpoints**:
  - sm: 640px
  - md: 768px
  - lg: 1024px
  - xl: 1280px
  - 2xl: 1536px
- **Layout**: Sidebar ẩn trên mobile, hiển thị thanh điều hướng dưới
- **Components**: Các thành phần tự điều chỉnh kích thước theo không gian

## Animation & Transitions
- **Transitions**: 150ms - 200ms, ease-in-out cho hầu hết các thành phần
- **Hover effects**: Tinh tế, thay đổi độ sáng hoặc opacity
- **Page transitions**: Fade và slide nhẹ nhàng
- **Loading states**: Spinner hoặc skeleton loaders đơn giản, nhất quán

## Hiệu ứng trạng thái
- **Hover**: Tăng nhẹ brightness hoặc thay đổi opacity
- **Active**: Scale down nhẹ (0.98) và darkening
- **Focus**: Outline màu primary, không quá nổi bật
- **Disabled**: Opacity giảm (0.6-0.7), cursor not-allowed

## Accessibility
- **Color contrast**: Đảm bảo đủ độ tương phản giữa text và background
- **Focus indicators**: Rõ ràng cho tất cả các thành phần interactive
- **Semantic HTML**: Sử dụng các thẻ HTML đúng mục đích
- **ARIA attributes**: Bổ sung khi cần thiết

## Dark mode
- **Background**: Gradient từ #0F172A -> #1E293B
- **Foreground**: Màu text sáng hơn (#E2E8F0)
- **Primary**: Màu sáng hơn một chút (#3B82F6)
- **Card/surfaces**: Màu tối hơn background một chút (#1E293B)
- **Borders**: Sáng hơn background, nhưng vẫn tối (#334155)

## Best practices
1. Luôn duy trì tính nhất quán giữa các trang và thành phần
2. Sử dụng spacing và typography scale đã định nghĩa
3. Tiêu đề h1 có gradient, kích thước 3xl (1.875rem), tracking-tight
4. Section titles có icon, kích thước text-lg, font-semibold kèm theo mr-2
5. Chia nội dung theo grid layout với gap-4 / gap-6 cho desktop
6. Sử dụng đúng kích thước icon (h-4 w-4, h-5 w-5) cho từng ngữ cảnh
7. Sử dụng container max-w-7xl làm wrapper chính cho nội dung
8. Tránh quá nhiều biến thể của cùng một thành phần
9. Tối ưu performance bằng cách hạn chế hiệu ứng nặng
10. Thường xuyên kiểm tra trên các kích thước màn hình khác nhau
11. Tránh axes và legends không cần thiết trong charts
12. Sử dụng opacity-80/70 cho text phụ thay vì text-muted