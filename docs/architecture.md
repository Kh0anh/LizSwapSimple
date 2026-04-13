# Kiến Trúc Hệ Thống (C4 Model)

> **Phiên bản:** v1 | **Ngày tạo:** 9 tháng 4 năm 2026 | **Tác giả:** Khanh

Tài liệu này phân tích kiến trúc của LizSwapSimple dựa trên mô hình C4, giúp làm rõ các mức độ tương tác và ranh giới kỹ thuật từ tổng quan đến chi tiết.

Để dễ dàng theo dõi, tài liệu kỹ thuật đã được phân tách cụ thể thành 3 phần sau:

1. **[C1 - System Context](architecture/c4-context.md)**: Tổng quan bối cảnh hệ thống, vai trò của người dùng và các bên thứ 3 (Ví, Mạng Blockchain).
2. **[C2 - Container](architecture/c4-container.md)**: Chia cắt cấu trúc tổng thể thành FrontEnd, Smart Contract và các External Provider.
3. **[C3 - Component](architecture/c4-component.md)**: Mô tả các thành phần (Components) con trong Frontend và các mảnh ghép (Pair, Router, Factory) trong thiết kế Smart Contract.
