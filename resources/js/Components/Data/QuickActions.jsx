import { useState, useEffect, useRef } from 'react';
import { Link, router } from '@inertiajs/react';
import route from '../../Utils/route';
import { toast } from '../../Utils/toast';

export default function QuickActions({ onQuickCreate }) {
    const [isOpen, setIsOpen] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const menuRef = useRef(null);
    const buttonRef = useRef(null);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                menuRef.current &&
                !menuRef.current.contains(event.target) &&
                buttonRef.current &&
                !buttonRef.current.contains(event.target)
            ) {
                setShowMenu(false);
            }
        };

        if (showMenu) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [showMenu]);

    // Initialize Flowbite
    useEffect(() => {
        if (typeof window !== 'undefined' && window.Flowbite) {
            window.Flowbite.init();
        }
    }, []);

    const quickActions = [
        {
            label: 'Tạo Collection',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
            ),
            href: route('user.data.create'),
            color: 'blue',
        },
        {
            label: 'Import JSON',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
            ),
            href: route('user.data.index') + '?import=json',
            color: 'green',
        },
        {
            label: 'Import CSV',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
            ),
            href: route('user.data.index') + '?import=csv',
            color: 'purple',
        },
        {
            label: 'Thống kê',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
            ),
            href: route('user.data.statistics'),
            color: 'orange',
        },
    ];

    const handleActionClick = (action) => {
        if (action.href.startsWith('http') || action.href.startsWith('/')) {
            router.visit(action.href);
        }
        setShowMenu(false);
        setIsOpen(false);
    };

    return (
        <>
            {/* Floating Action Button */}
            <div className="fixed bottom-6 right-6 z-50">
                <button
                    ref={buttonRef}
                    type="button"
                    onClick={() => {
                        setIsOpen(!isOpen);
                        setShowMenu(!showMenu);
                    }}
                    className="group relative flex items-center justify-center w-14 h-14 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110 focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-800"
                    data-tooltip-target="fab-tooltip"
                    data-tooltip-placement="left"
                >
                    <svg
                        className={`w-6 h-6 transition-transform duration-300 ${isOpen ? 'rotate-45' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                </button>

                {/* Action Menu - Flowbite Dropdown */}
                {showMenu && (
                    <div
                        ref={menuRef}
                        className="absolute bottom-16 right-0 mb-2 w-56 bg-white rounded-lg shadow-lg dark:bg-gray-800 border border-gray-200 dark:border-gray-700 z-50 animate-in fade-in slide-in-from-bottom-2 duration-200"
                    >
                        <div className="py-2">
                            {quickActions.map((action, index) => (
                                <button
                                    key={index}
                                    onClick={() => handleActionClick(action)}
                                    className={`w-full flex items-center px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                                        index === 0 ? 'rounded-t-lg' : ''
                                    } ${index === quickActions.length - 1 ? 'rounded-b-lg' : ''}`}
                                >
                                    <span className={`mr-3 text-${action.color}-600 dark:text-${action.color}-400`}>
                                        {action.icon}
                                    </span>
                                    <span className="font-medium">{action.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Tooltip */}
                <div
                    id="fab-tooltip"
                    role="tooltip"
                    className="absolute z-10 invisible inline-block px-3 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg shadow-sm opacity-0 tooltip dark:bg-gray-700 right-16"
                >
                    Quick Actions
                    <div className="tooltip-arrow" data-popper-arrow></div>
                </div>
            </div>

            {/* Backdrop when menu is open */}
            {showMenu && (
                <div
                    className="fixed inset-0 bg-black/20 dark:bg-black/40 z-40"
                    onClick={() => {
                        setShowMenu(false);
                        setIsOpen(false);
                    }}
                ></div>
            )}
        </>
    );
}

