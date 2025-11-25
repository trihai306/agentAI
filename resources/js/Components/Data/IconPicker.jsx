import { useState, useEffect } from 'react';

export default function IconPicker({ value = '', onChange, label = 'Icon' }) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Initialize Flowbite
    useEffect(() => {
        if (typeof window !== 'undefined' && window.Flowbite && isOpen) {
            window.Flowbite.init();
        }
    }, [isOpen]);

    // Popular emoji categories with descriptions for search
    const emojiCategories = {
        'Phổ biến': [
            { emoji: '📊', keywords: ['chart', 'data', 'analytics', 'thống kê', 'biểu đồ'] },
            { emoji: '📁', keywords: ['folder', 'file', 'thư mục'] },
            { emoji: '📂', keywords: ['folder', 'open', 'thư mục mở'] },
            { emoji: '📋', keywords: ['clipboard', 'list', 'danh sách'] },
            { emoji: '📝', keywords: ['note', 'write', 'ghi chú'] },
            { emoji: '📄', keywords: ['document', 'page', 'tài liệu'] },
            { emoji: '📑', keywords: ['bookmark', 'tab', 'đánh dấu'] },
            { emoji: '📃', keywords: ['page', 'document', 'trang'] },
            { emoji: '📜', keywords: ['scroll', 'document', 'cuộn'] },
            { emoji: '📰', keywords: ['newspaper', 'news', 'báo'] },
            { emoji: '📓', keywords: ['notebook', 'book', 'sổ tay'] },
            { emoji: '📔', keywords: ['notebook', 'decorated', 'sổ tay'] },
            { emoji: '📒', keywords: ['ledger', 'notebook', 'sổ sách'] },
            { emoji: '📚', keywords: ['books', 'library', 'thư viện'] },
            { emoji: '📖', keywords: ['book', 'read', 'đọc'] },
            { emoji: '🔖', keywords: ['bookmark', 'mark', 'đánh dấu'] },
            { emoji: '📌', keywords: ['pin', 'pushpin', 'ghim'] },
            { emoji: '📍', keywords: ['location', 'pin', 'vị trí'] },
            { emoji: '💾', keywords: ['floppy', 'disk', 'save', 'lưu'] },
            { emoji: '📦', keywords: ['package', 'box', 'gói'] },
        ],
        'Dữ liệu': [
            { emoji: '💾', keywords: ['floppy', 'disk', 'save', 'lưu'] },
            { emoji: '💿', keywords: ['cd', 'disk', 'đĩa'] },
            { emoji: '📀', keywords: ['dvd', 'disk', 'đĩa'] },
            { emoji: '🗂️', keywords: ['card', 'index', 'dividers', 'phân loại'] },
            { emoji: '📊', keywords: ['chart', 'data', 'analytics', 'thống kê'] },
            { emoji: '📈', keywords: ['chart', 'increasing', 'tăng trưởng'] },
            { emoji: '📉', keywords: ['chart', 'decreasing', 'giảm'] },
            { emoji: '📋', keywords: ['clipboard', 'list', 'danh sách'] },
            { emoji: '📁', keywords: ['folder', 'file', 'thư mục'] },
            { emoji: '📂', keywords: ['folder', 'open', 'thư mục mở'] },
            { emoji: '🗄️', keywords: ['file', 'cabinet', 'tủ hồ sơ'] },
            { emoji: '🗃️', keywords: ['card', 'file', 'box', 'hộp thẻ'] },
            { emoji: '📦', keywords: ['package', 'box', 'gói'] },
            { emoji: '📥', keywords: ['inbox', 'tray', 'nhận'] },
            { emoji: '📤', keywords: ['outbox', 'tray', 'gửi'] },
            { emoji: '💽', keywords: ['computer', 'disk', 'máy tính'] },
            { emoji: '🖥️', keywords: ['desktop', 'computer', 'máy tính'] },
            { emoji: '💻', keywords: ['laptop', 'computer', 'máy tính'] },
            { emoji: '📱', keywords: ['mobile', 'phone', 'điện thoại'] },
            { emoji: '⌨️', keywords: ['keyboard', 'bàn phím'] },
        ],
        'Tài khoản': [
            { emoji: '👤', keywords: ['person', 'user', 'người dùng'] },
            { emoji: '👥', keywords: ['people', 'users', 'nhóm người'] },
            { emoji: '👨', keywords: ['man', 'người đàn ông'] },
            { emoji: '👩', keywords: ['woman', 'người phụ nữ'] },
            { emoji: '👨‍💼', keywords: ['business', 'man', 'doanh nhân'] },
            { emoji: '👩‍💼', keywords: ['business', 'woman', 'nữ doanh nhân'] },
            { emoji: '👨‍💻', keywords: ['technologist', 'man', 'lập trình viên'] },
            { emoji: '👩‍💻', keywords: ['technologist', 'woman', 'nữ lập trình viên'] },
            { emoji: '👨‍🔬', keywords: ['scientist', 'man', 'nhà khoa học'] },
            { emoji: '👩‍🔬', keywords: ['scientist', 'woman', 'nữ nhà khoa học'] },
            { emoji: '👨‍🎨', keywords: ['artist', 'man', 'nghệ sĩ'] },
            { emoji: '👩‍🎨', keywords: ['artist', 'woman', 'nữ nghệ sĩ'] },
            { emoji: '👨‍🏫', keywords: ['teacher', 'man', 'giáo viên'] },
            { emoji: '👩‍🏫', keywords: ['teacher', 'woman', 'nữ giáo viên'] },
            { emoji: '👨‍🚀', keywords: ['astronaut', 'man', 'phi hành gia'] },
            { emoji: '👩‍🚀', keywords: ['astronaut', 'woman', 'nữ phi hành gia'] },
            { emoji: '🧑', keywords: ['person', 'adult', 'người lớn'] },
            { emoji: '🧑‍💼', keywords: ['office', 'worker', 'nhân viên văn phòng'] },
            { emoji: '🧑‍💻', keywords: ['technologist', 'lập trình viên'] },
        ],
        'Bình luận': [
            { emoji: '💬', keywords: ['speech', 'balloon', 'bình luận'] },
            { emoji: '💭', keywords: ['thought', 'balloon', 'suy nghĩ'] },
            { emoji: '🗨️', keywords: ['speech', 'left', 'nói'] },
            { emoji: '🗯️', keywords: ['anger', 'speech', 'tức giận'] },
            { emoji: '📢', keywords: ['megaphone', 'loudspeaker', 'loa'] },
            { emoji: '📣', keywords: ['megaphone', 'announcement', 'thông báo'] },
            { emoji: '📯', keywords: ['postal', 'horn', 'kèn'] },
            { emoji: '📮', keywords: ['postbox', 'mail', 'hộp thư'] },
            { emoji: '📧', keywords: ['email', 'mail', 'thư điện tử'] },
            { emoji: '📨', keywords: ['incoming', 'envelope', 'thư đến'] },
            { emoji: '📩', keywords: ['envelope', 'arrow', 'thư có mũi tên'] },
            { emoji: '📪', keywords: ['mailbox', 'closed', 'hộp thư đóng'] },
            { emoji: '📫', keywords: ['mailbox', 'raised', 'hộp thư mở'] },
            { emoji: '📬', keywords: ['mailbox', 'mail', 'hộp thư có thư'] },
            { emoji: '📭', keywords: ['mailbox', 'empty', 'hộp thư trống'] },
            { emoji: '💌', keywords: ['love', 'letter', 'thư tình'] },
            { emoji: '✉️', keywords: ['envelope', 'letter', 'phong bì'] },
            { emoji: '📮', keywords: ['postbox', 'mail', 'hộp thư'] },
            { emoji: '📨', keywords: ['incoming', 'envelope', 'thư đến'] },
            { emoji: '📧', keywords: ['email', 'mail', 'thư điện tử'] },
        ],
        'Bài viết': [
            { emoji: '📝', keywords: ['memo', 'note', 'write', 'ghi chú'] },
            { emoji: '✍️', keywords: ['writing', 'hand', 'viết'] },
            { emoji: '📄', keywords: ['page', 'facing', 'up', 'trang'] },
            { emoji: '📃', keywords: ['page', 'curl', 'trang cuộn'] },
            { emoji: '📑', keywords: ['bookmark', 'tabs', 'đánh dấu'] },
            { emoji: '📜', keywords: ['scroll', 'document', 'cuộn'] },
            { emoji: '📰', keywords: ['newspaper', 'news', 'báo'] },
            { emoji: '📓', keywords: ['notebook', 'sổ tay'] },
            { emoji: '📔', keywords: ['notebook', 'decorated', 'sổ tay đẹp'] },
            { emoji: '📒', keywords: ['ledger', 'sổ sách'] },
            { emoji: '📕', keywords: ['closed', 'book', 'red', 'sách đỏ'] },
            { emoji: '📗', keywords: ['green', 'book', 'sách xanh'] },
            { emoji: '📘', keywords: ['blue', 'book', 'sách xanh dương'] },
            { emoji: '📙', keywords: ['orange', 'book', 'sách cam'] },
            { emoji: '📚', keywords: ['books', 'library', 'thư viện'] },
            { emoji: '📖', keywords: ['open', 'book', 'sách mở'] },
            { emoji: '🔖', keywords: ['bookmark', 'đánh dấu'] },
            { emoji: '📋', keywords: ['clipboard', 'danh sách'] },
            { emoji: '📊', keywords: ['chart', 'biểu đồ'] },
            { emoji: '📈', keywords: ['chart', 'increasing', 'tăng'] },
        ],
        'Sản phẩm': [
            { emoji: '🛍️', keywords: ['shopping', 'bags', 'mua sắm'] },
            { emoji: '🛒', keywords: ['shopping', 'cart', 'giỏ hàng'] },
            { emoji: '🛎️', keywords: ['bellhop', 'bell', 'chuông'] },
            { emoji: '🛏️', keywords: ['bed', 'giường'] },
            { emoji: '🛋️', keywords: ['couch', 'lamp', 'ghế sofa'] },
            { emoji: '🪑', keywords: ['chair', 'ghế'] },
            { emoji: '🚪', keywords: ['door', 'cửa'] },
            { emoji: '🪟', keywords: ['window', 'cửa sổ'] },
            { emoji: '🪞', keywords: ['mirror', 'gương'] },
            { emoji: '🖼️', keywords: ['framed', 'picture', 'khung ảnh'] },
            { emoji: '🛒', keywords: ['shopping', 'cart', 'giỏ hàng'] },
            { emoji: '🛍️', keywords: ['shopping', 'bags', 'mua sắm'] },
            { emoji: '📦', keywords: ['package', 'gói hàng'] },
            { emoji: '📮', keywords: ['postbox', 'hộp thư'] },
            { emoji: '🏷️', keywords: ['label', 'tag', 'nhãn'] },
            { emoji: '💰', keywords: ['money', 'bag', 'tiền'] },
            { emoji: '💳', keywords: ['credit', 'card', 'thẻ tín dụng'] },
            { emoji: '💎', keywords: ['gem', 'diamond', 'kim cương'] },
            { emoji: '🎁', keywords: ['gift', 'present', 'quà'] },
            { emoji: '🎀', keywords: ['ribbon', 'ruy băng'] },
        ],
        'Công việc': [
            { emoji: '💼', keywords: ['briefcase', 'cặp'] },
            { emoji: '📁', keywords: ['folder', 'thư mục'] },
            { emoji: '📂', keywords: ['open', 'folder', 'thư mục mở'] },
            { emoji: '🗂️', keywords: ['card', 'index', 'dividers', 'phân loại'] },
            { emoji: '📊', keywords: ['chart', 'biểu đồ'] },
            { emoji: '📈', keywords: ['chart', 'increasing', 'tăng'] },
            { emoji: '📉', keywords: ['chart', 'decreasing', 'giảm'] },
            { emoji: '📋', keywords: ['clipboard', 'danh sách'] },
            { emoji: '📌', keywords: ['pushpin', 'ghim'] },
            { emoji: '📍', keywords: ['round', 'pushpin', 'ghim tròn'] },
            { emoji: '🗄️', keywords: ['file', 'cabinet', 'tủ hồ sơ'] },
            { emoji: '🗃️', keywords: ['card', 'file', 'box', 'hộp thẻ'] },
            { emoji: '📦', keywords: ['package', 'gói'] },
            { emoji: '📥', keywords: ['inbox', 'tray', 'nhận'] },
            { emoji: '📤', keywords: ['outbox', 'tray', 'gửi'] },
            { emoji: '📊', keywords: ['bar', 'chart', 'biểu đồ cột'] },
            { emoji: '📈', keywords: ['chart', 'increasing', 'tăng'] },
            { emoji: '📉', keywords: ['chart', 'decreasing', 'giảm'] },
            { emoji: '📋', keywords: ['clipboard', 'danh sách'] },
            { emoji: '📌', keywords: ['pushpin', 'ghim'] },
        ],
        'Khác': [
            { emoji: '⭐', keywords: ['star', 'sao'] },
            { emoji: '🌟', keywords: ['glowing', 'star', 'sao sáng'] },
            { emoji: '✨', keywords: ['sparkles', 'lấp lánh'] },
            { emoji: '💫', keywords: ['dizzy', 'chóng mặt'] },
            { emoji: '🔥', keywords: ['fire', 'lửa'] },
            { emoji: '💯', keywords: ['hundred', 'points', '100 điểm'] },
            { emoji: '🎯', keywords: ['target', 'dart', 'mục tiêu'] },
            { emoji: '🎨', keywords: ['artist', 'palette', 'bảng màu'] },
            { emoji: '🎭', keywords: ['theater', 'masks', 'mặt nạ'] },
            { emoji: '🎪', keywords: ['circus', 'tent', 'rạp xiếc'] },
            { emoji: '🎬', keywords: ['clapper', 'board', 'phim'] },
            { emoji: '🎤', keywords: ['microphone', 'mic', 'micro'] },
            { emoji: '🎧', keywords: ['headphone', 'tai nghe'] },
            { emoji: '🎵', keywords: ['musical', 'note', 'nốt nhạc'] },
            { emoji: '🎶', keywords: ['musical', 'notes', 'nhiều nốt'] },
            { emoji: '🎼', keywords: ['musical', 'score', 'bản nhạc'] },
            { emoji: '🎹', keywords: ['piano', 'keyboard', 'đàn piano'] },
            { emoji: '🥁', keywords: ['drum', 'trống'] },
            { emoji: '🎷', keywords: ['saxophone', 'kèn saxophone'] },
            { emoji: '🎺', keywords: ['trumpet', 'kèn trumpet'] },
        ],
    };

    // Filter emojis by search query
    const filteredEmojis = Object.entries(emojiCategories).reduce((acc, [category, items]) => {
        const filtered = items.filter(item => {
            if (!searchQuery) return true;
            const query = searchQuery.toLowerCase();
            return item.keywords.some(keyword => keyword.toLowerCase().includes(query));
        });
        if (filtered.length > 0) {
            acc[category] = filtered.map(item => item.emoji);
        }
        return acc;
    }, {});

    const handleSelectIcon = (icon) => {
        onChange(icon);
        setIsOpen(false);
        setSearchQuery('');
    };

    return (
        <>
            <div>
                <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                    {label}
                </label>
                <div className="flex items-center space-x-2">
                    <button
                        type="button"
                        onClick={() => setIsOpen(true)}
                        className="flex items-center justify-center w-16 h-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                        {value ? (
                            <span className="text-2xl">{value}</span>
                        ) : (
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                        )}
                    </button>
                    <input
                        type="text"
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder="Hoặc nhập emoji..."
                        className="flex-1 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                        maxLength={2}
                    />
                    {value && (
                        <button
                            type="button"
                            onClick={() => onChange('')}
                            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    )}
                </div>
            </div>

            {/* Flowbite Modal */}
            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 bg-gray-900/50 dark:bg-gray-900/75 z-50"
                        onClick={() => setIsOpen(false)}
                    ></div>
                    <div
                        id="icon-picker-modal"
                        tabIndex="-1"
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-x-hidden overflow-y-auto"
                    >
                        <div className="relative w-full max-w-2xl max-h-[90vh] bg-white rounded-lg shadow dark:bg-gray-800">
                            {/* Modal header */}
                            <div className="flex items-center justify-between p-4 md:p-5 border-b rounded-t dark:border-gray-700">
                                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                                    Chọn Icon
                                </h3>
                                <button
                                    type="button"
                                    onClick={() => setIsOpen(false)}
                                    className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center dark:hover:bg-gray-600 dark:hover:text-white"
                                >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                    <span className="sr-only">Close modal</span>
                                </button>
                            </div>

                            {/* Modal body */}
                            <div className="p-4 md:p-5 space-y-4 max-h-[60vh] overflow-y-auto">
                                {/* Search */}
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                        <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                    </div>
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg bg-gray-50 dark:bg-gray-700 text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-600 dark:focus:border-blue-600"
                                        placeholder="Tìm kiếm icon (ví dụ: data, user, comment...)"
                                    />
                                    {searchQuery && (
                                        <button
                                            onClick={() => setSearchQuery('')}
                                            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    )}
                                </div>

                                {/* Emoji Categories */}
                                {Object.keys(filteredEmojis).length > 0 ? (
                                    Object.entries(filteredEmojis).map(([category, emojis]) => (
                                        <div key={category} className="space-y-2">
                                            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                                                {category} ({emojis.length})
                                            </h4>
                                            <div className="grid grid-cols-8 sm:grid-cols-10 gap-2">
                                                {emojis.map((emoji, index) => (
                                                    <button
                                                        key={`${category}-${index}`}
                                                        type="button"
                                                        onClick={() => handleSelectIcon(emoji)}
                                                        className={`p-2 sm:p-3 text-xl sm:text-2xl rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 border-2 hover:scale-110 ${
                                                            value === emoji
                                                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 ring-2 ring-blue-300 dark:ring-blue-700'
                                                                : 'border-transparent hover:border-gray-300 dark:hover:border-gray-600'
                                                        }`}
                                                        title={emoji}
                                                    >
                                                        {emoji}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-8">
                                        <p className="text-gray-500 dark:text-gray-400">Không tìm thấy icon nào</p>
                                    </div>
                                )}
                            </div>

                            {/* Modal footer */}
                            <div className="flex items-center justify-between p-4 md:p-5 border-t border-gray-200 rounded-b dark:border-gray-700">
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                    {value && (
                                        <span>
                                            Icon đã chọn: <span className="text-2xl">{value}</span>
                                        </span>
                                    )}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIsOpen(false)}
                                    className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                                >
                                    Đóng
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </>
    );
}

