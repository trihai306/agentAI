import React from 'react';

export default function PhoneControls({
    selectedDevice,
    click,
    swipe,
    type,
    pressKey
}) {
    const handleClick = (x, y) => {
        click(x, y);
    };

    const handleSwipe = (x1, y1, x2, y2) => {
        swipe(x1, y1, x2, y2);
    };

    const handleKeyPress = (key) => {
        pressKey(key);
    };

    return (
        <div className="space-y-3 sm:space-y-4">
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
                <button
                    onClick={() => handleKeyPress('HOME')}
                    className="px-3 sm:px-4 py-2 sm:py-3 bg-gradient-to-br from-gray-700 to-gray-800 text-white rounded-lg sm:rounded-xl hover:from-gray-600 hover:to-gray-700 font-medium shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex flex-col sm:flex-row items-center justify-center space-y-1 sm:space-y-0 sm:space-x-2 border border-gray-600/50 text-xs sm:text-sm"
                >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    <span>Home</span>
                </button>
                <button
                    onClick={() => handleKeyPress('BACK')}
                    className="px-3 sm:px-4 py-2 sm:py-3 bg-gradient-to-br from-gray-700 to-gray-800 text-white rounded-lg sm:rounded-xl hover:from-gray-600 hover:to-gray-700 font-medium shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex flex-col sm:flex-row items-center justify-center space-y-1 sm:space-y-0 sm:space-x-2 border border-gray-600/50 text-xs sm:text-sm"
                >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    <span>Back</span>
                </button>
                <button
                    onClick={() => handleKeyPress('MENU')}
                    className="px-3 sm:px-4 py-2 sm:py-3 bg-gradient-to-br from-gray-700 to-gray-800 text-white rounded-lg sm:rounded-xl hover:from-gray-600 hover:to-gray-700 font-medium shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex flex-col sm:flex-row items-center justify-center space-y-1 sm:space-y-0 sm:space-x-2 border border-gray-600/50 text-xs sm:text-sm"
                >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                    <span>Menu</span>
                </button>
            </div>

            <div className="flex items-center space-x-2 text-xs text-gray-400 bg-gray-800/50 rounded-lg px-3 sm:px-4 py-2 border border-gray-700/50">
                <svg className="w-3 h-3 sm:w-4 sm:h-4 text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-xs sm:text-sm">💡 Tip: Click vào ảnh để điều khiển (sắp có)</p>
            </div>
        </div>
    );
}

