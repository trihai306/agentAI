import { Head, Link } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import ThemeController from '../Components/ThemeController';

export default function Landing() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <>
            <Head title="AutoAI Phone - Tự động hóa điện thoại với AI Agent" />

            <div className="min-h-screen bg-white dark:bg-gray-900 overflow-x-hidden">
                {/* Navigation */}
                <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
                    scrolled
                        ? 'bg-white/95 dark:bg-gray-900/95 backdrop-blur-md shadow-sm border-b border-gray-200 dark:border-gray-800'
                        : 'bg-transparent'
                }`}>
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between items-center h-16">
                            <Link href="/" className="flex items-center group">
                                <div className="w-10 h-10 bg-gray-900 dark:bg-white rounded-lg flex items-center justify-center transition-colors group-hover:bg-gray-800 dark:group-hover:bg-gray-100">
                                    <svg className="w-6 h-6 text-white dark:text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <span className="ml-3 text-xl font-semibold text-gray-900 dark:text-white">
                                    AutoAI Phone
                                </span>
                            </Link>

                            <div className="hidden lg:flex items-center space-x-8">
                                <a href="#features" className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">
                                    Tính năng
                                </a>
                                <a href="#how-it-works" className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">
                                    Cách hoạt động
                                </a>
                                <a href="#benefits" className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">
                                    Lợi ích
                                </a>
                                <div className="mx-2">
                                    <ThemeController />
                                </div>
                                <Link
                                    href="/login"
                                    className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                                >
                                    Đăng nhập
                                </Link>
                                <Link
                                    href="/register"
                                    className="px-5 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors text-sm font-medium"
                                >
                                    Bắt đầu ngay
                                </Link>
                            </div>

                            <div className="lg:hidden flex items-center space-x-3">
                                <ThemeController />
                                <button
                                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                    className="p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        {mobileMenuOpen ? (
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        ) : (
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                        )}
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Mobile menu */}
                    {mobileMenuOpen && (
                        <div className="lg:hidden border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
                            <div className="px-4 pt-4 pb-4 space-y-2">
                                <a href="#features" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">Tính năng</a>
                                <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">Cách hoạt động</a>
                                <a href="#benefits" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">Lợi ích</a>
                                <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">Đăng nhập</Link>
                                <Link href="/register" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg text-center font-medium mt-2">Bắt đầu ngay</Link>
                            </div>
                        </div>
                    )}
                </nav>

                {/* Hero Section */}
                <section className="relative min-h-screen flex items-center justify-center pt-24 pb-20 px-4 sm:px-6 lg:px-8">
                    <div className="absolute inset-0 bg-gray-50 dark:bg-gray-900"></div>

                    <div className="max-w-6xl mx-auto relative z-10 w-full">
                        <div className="text-center">
                            {/* Badge */}
                            <div className="inline-flex items-center mb-8">
                                <span className="inline-flex items-center px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full text-sm font-medium border border-gray-200 dark:border-gray-700">
                                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                                    </svg>
                                    Powered by Advanced AI
                                </span>
                            </div>

                            {/* Main Heading */}
                            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
                                Tự động hóa điện thoại
                                <span className="block mt-2 text-gray-600 dark:text-gray-400">
                                    với AI Agent thông minh
                                </span>
                            </h1>

                            {/* Subheading */}
                            <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400 mb-10 max-w-3xl mx-auto leading-relaxed">
                                Điều khiển và tự động hóa các thao tác trên điện thoại của bạn bằng AI.
                                Từ việc tự động thực hiện các tác vụ phức tạp đến quản lý ứng dụng, tất cả đều được xử lý bởi AI Agent thông minh.
                            </p>

                            {/* CTA Buttons */}
                            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
                                <Link
                                    href="/register"
                                    className="inline-flex items-center justify-center px-8 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors font-medium"
                                >
                                    Bắt đầu miễn phí
                                    <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                    </svg>
                                </Link>
                                <a
                                    href="#how-it-works"
                                    className="inline-flex items-center justify-center px-8 py-3 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors font-medium"
                                >
                                    Tìm hiểu thêm
                                </a>
                            </div>

                            {/* Stats */}
                            <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto">
                                <div className="text-center">
                                    <div className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-2">99%</div>
                                    <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Độ chính xác</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-2">24/7</div>
                                    <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Hoạt động</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-2">10x</div>
                                    <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Nhanh hơn</div>
                                </div>
                            </div>
                        </div>

                        {/* Hero Illustration */}
                        <div className="mt-20">
                            <div className="relative mx-auto max-w-5xl">
                                <div className="bg-white dark:bg-gray-800 rounded-xl p-8 md:p-12 shadow-lg border border-gray-200 dark:border-gray-700">
                                    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-8 md:p-12">
                                        {/* Header */}
                                        <div className="flex items-center justify-between mb-8">
                                            <div className="flex items-center space-x-4">
                                                <div className="w-12 h-12 bg-gray-900 dark:bg-white rounded-lg flex items-center justify-center">
                                                    <svg className="w-7 h-7 text-white dark:text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                                    </svg>
                                                </div>
                                                <div>
                                                    <div className="text-base font-semibold text-gray-900 dark:text-white">AI Agent</div>
                                                    <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                                                        <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                                                        Đang xử lý yêu cầu...
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex space-x-2">
                                                <div className="w-2.5 h-2.5 bg-red-500 rounded-full"></div>
                                                <div className="w-2.5 h-2.5 bg-yellow-500 rounded-full"></div>
                                                <div className="w-2.5 h-2.5 bg-green-500 rounded-full"></div>
                                            </div>
                                        </div>

                                        {/* Content */}
                                        <div className="space-y-3">
                                            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full w-full"></div>
                                            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full w-4/5"></div>
                                            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full w-3/4"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Features Section */}
                <section id="features" className="relative py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900">
                    <div className="max-w-7xl mx-auto">
                        <div className="text-center mb-16">
                            <div className="inline-block mb-4">
                                <span className="inline-flex items-center px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full text-sm font-medium">
                                    Tính năng
                                </span>
                            </div>
                            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
                                Tính năng mạnh mẽ
                            </h2>
                            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                                Khám phá các tính năng giúp bạn tự động hóa mọi thao tác trên điện thoại
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[
                                { icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z', title: 'AI Thông minh', desc: 'AI Agent có khả năng hiểu và thực hiện các lệnh phức tạp, tự động phân tích và đưa ra quyết định thông minh.' },
                                { icon: 'M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z', title: 'Điều khiển từ xa', desc: 'Điều khiển điện thoại từ xa thông qua giao diện web, thực hiện các thao tác như click, swipe, nhập liệu một cách dễ dàng.' },
                                { icon: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15', title: 'Tự động hóa tác vụ', desc: 'Tạo và lưu các script tự động để thực hiện các tác vụ lặp đi lặp lại, tiết kiệm thời gian và công sức.' },
                                { icon: 'M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z M15 13a3 3 0 11-6 0 3 3 0 016 0z', title: 'Chụp màn hình', desc: 'Tự động chụp màn hình và phân tích nội dung, giúp AI hiểu được trạng thái hiện tại của ứng dụng.' },
                                { icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z', title: 'Bảo mật cao', desc: 'Dữ liệu được mã hóa và bảo vệ an toàn, đảm bảo quyền riêng tư và bảo mật thông tin của bạn.' },
                                { icon: 'M13 10V3L4 14h7v7l9-11h-7z', title: 'Tốc độ nhanh', desc: 'Xử lý nhanh chóng với độ trễ thấp, đảm bảo trải nghiệm mượt mà và hiệu quả.' },
                            ].map((feature, idx) => (
                                <div key={idx} className="group bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow border border-gray-200 dark:border-gray-700">
                                    <div className="absolute inset-0 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                    <div className="relative z-10">
                                        <div className={`relative w-16 h-16 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-xl`}>
                                            <div className="absolute inset-0 bg-gradient-to-br ${feature.color} rounded-2xl blur opacity-50 group-hover:opacity-100 transition-opacity"></div>
                                            <svg className="relative w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={feature.icon} />
                                            </svg>
                                        </div>
                                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-purple-600 transition-all duration-300">
                                            {feature.title}
                                        </h3>
                                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-lg">
                                            {feature.desc}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* How It Works Section */}
                <section id="how-it-works" className="relative py-20 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-900">
                    <div className="max-w-7xl mx-auto">
                        <div className="text-center mb-16">
                            <div className="inline-block mb-4">
                                <span className="inline-flex items-center px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full text-sm font-medium">
                                    Quy trình
                                </span>
                            </div>
                            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
                                Cách hoạt động
                            </h2>
                            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                                Chỉ với 3 bước đơn giản để bắt đầu tự động hóa điện thoại của bạn
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
                            {/* Connecting line for desktop */}
                            <div className="hidden md:block absolute top-12 left-1/4 right-1/4 h-0.5 bg-gray-200 dark:bg-gray-700"></div>

                            {[
                                { num: '1', title: 'Kết nối thiết bị', desc: 'Kết nối điện thoại của bạn với hệ thống thông qua USB hoặc mạng. Hệ thống sẽ tự động nhận diện và thiết lập kết nối.' },
                                { num: '2', title: 'Gửi yêu cầu', desc: 'Nhập yêu cầu của bạn bằng ngôn ngữ tự nhiên. AI Agent sẽ phân tích và lập kế hoạch thực hiện các bước cần thiết.' },
                                { num: '3', title: 'Xem kết quả', desc: 'AI Agent sẽ tự động thực hiện các thao tác và cập nhật kết quả theo thời gian thực. Bạn có thể theo dõi quá trình và xem kết quả ngay lập tức.' },
                            ].map((step, idx) => (
                                <div key={idx} className="text-center relative">
                                    <div className="relative inline-flex items-center justify-center w-16 h-16 bg-gray-900 dark:bg-white rounded-lg mb-6">
                                        <span className="text-2xl font-bold text-white dark:text-gray-900">{step.num}</span>
                                    </div>
                                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                                        {step.title}
                                    </h3>
                                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-sm">
                                        {step.desc}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Benefits Section */}
                <section id="benefits" className="relative py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900">
                    <div className="max-w-7xl mx-auto">
                        <div className="text-center mb-16">
                            <div className="inline-block mb-4">
                                <span className="inline-flex items-center px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full text-sm font-medium">
                                    Lợi ích
                                </span>
                            </div>
                            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
                                Lợi ích khi sử dụng
                            </h2>
                            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                                Tại sao nên chọn AutoAI Phone cho nhu cầu tự động hóa của bạn
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {[
                                { icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', title: 'Tiết kiệm thời gian', desc: 'Tự động hóa các tác vụ lặp đi lặp lại, giúp bạn tiết kiệm hàng giờ mỗi ngày. Tập trung vào những việc quan trọng hơn.' },
                                { icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', title: 'Độ chính xác cao', desc: 'AI Agent thực hiện các thao tác với độ chính xác cao, giảm thiểu lỗi do con người. Đảm bảo kết quả nhất quán mỗi lần.' },
                                { icon: 'M13 10V3L4 14h7v7l9-11h-7z', title: 'Dễ sử dụng', desc: 'Giao diện trực quan, dễ sử dụng. Chỉ cần mô tả những gì bạn muốn, AI sẽ tự động thực hiện mà không cần kiến thức lập trình.' },
                                { icon: 'M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4', title: 'Mở rộng dễ dàng', desc: 'Hệ thống có thể mở rộng để xử lý nhiều thiết bị cùng lúc. Phù hợp cho cả cá nhân và doanh nghiệp.' },
                            ].map((benefit, idx) => (
                                <div key={idx} className="group bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow border border-gray-200 dark:border-gray-700">
                                    <div className="flex items-start space-x-4">
                                        <div className="flex-shrink-0 w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center group-hover:bg-gray-900 dark:group-hover:bg-white transition-colors">
                                            <svg className="w-6 h-6 text-gray-900 dark:text-white group-hover:text-white dark:group-hover:text-gray-900 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={benefit.icon} />
                                            </svg>
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                                {benefit.title}
                                            </h3>
                                            <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-sm">
                                                {benefit.desc}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="relative py-20 px-4 sm:px-6 lg:px-8 bg-gray-900 dark:bg-black">
                    <div className="max-w-4xl mx-auto text-center">
                        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
                            Sẵn sàng bắt đầu?
                        </h2>
                        <p className="text-lg text-gray-400 mb-8 max-w-2xl mx-auto">
                            Đăng ký ngay để trải nghiệm sức mạnh của AI Agent tự động hóa
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link
                                href="/register"
                                className="inline-flex items-center justify-center px-8 py-3 bg-white text-gray-900 rounded-lg hover:bg-gray-100 transition-colors font-medium"
                            >
                                Đăng ký miễn phí
                                <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                </svg>
                            </Link>
                            <Link
                                href="/login"
                                className="inline-flex items-center justify-center px-8 py-3 border border-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
                            >
                                Đã có tài khoản? Đăng nhập
                            </Link>
                        </div>
                    </div>
                </section>

                {/* Footer */}
                <footer className="relative bg-gray-900 dark:bg-black text-gray-400 py-12 px-4 sm:px-6 lg:px-8 border-t border-gray-800">
                    <div className="max-w-7xl mx-auto">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
                            <div className="col-span-1 md:col-span-2">
                                <Link href="/" className="flex items-center mb-4">
                                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                                        <svg className="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <span className="ml-3 text-xl font-semibold text-white">AutoAI Phone</span>
                                </Link>
                                <p className="text-gray-400 text-sm leading-relaxed max-w-md">
                                    Hệ thống tự động hóa điện thoại với AI Agent thông minh.
                                    Giúp bạn tiết kiệm thời gian và tăng năng suất làm việc.
                                </p>
                            </div>
                            <div>
                                <h4 className="text-white font-semibold text-sm mb-4">Sản phẩm</h4>
                                <ul className="space-y-2">
                                    <li><a href="#features" className="hover:text-white transition-colors text-sm">Tính năng</a></li>
                                    <li><a href="#how-it-works" className="hover:text-white transition-colors text-sm">Cách hoạt động</a></li>
                                    <li><a href="#benefits" className="hover:text-white transition-colors text-sm">Lợi ích</a></li>
                                </ul>
                            </div>
                            <div>
                                <h4 className="text-white font-semibold text-sm mb-4">Hỗ trợ</h4>
                                <ul className="space-y-2">
                                    <li><Link href="/login" className="hover:text-white transition-colors text-sm">Đăng nhập</Link></li>
                                    <li><Link href="/register" className="hover:text-white transition-colors text-sm">Đăng ký</Link></li>
                                </ul>
                            </div>
                        </div>
                        <div className="border-t border-gray-800 pt-6 text-center">
                            <p className="text-gray-500 text-sm">&copy; {new Date().getFullYear()} AutoAI Phone. All rights reserved.</p>
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
}
