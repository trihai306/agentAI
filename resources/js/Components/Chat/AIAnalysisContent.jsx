import React, { useState } from 'react';
import CodeBlock from './CodeBlock';

/**
 * Component để parse và hiển thị AI analysis content với các thẻ <thinking>, <analysis>, <reasoning>, <next_steps>, <reflection>
 */
export default function AIAnalysisContent({ content }) {
    const [collapsedSections, setCollapsedSections] = useState(new Set());
    if (!content || typeof content !== 'string') {
        return (
            <div className="prose prose-invert max-w-none">
                <p className="text-gray-900 dark:text-gray-100 leading-7 whitespace-pre-wrap break-words">
                    {content}
                </p>
            </div>
        );
    }

    // Parse các thẻ analysis, reasoning, reflection
    const parseContent = (text) => {
        const parts = [];
        let lastIndex = 0;

        // Regex để match các thẻ: <thinking>, <analysis>, <reasoning>, <next_steps>, <reflection>, <interaction_plan>
        const tagRegex = /<(thinking|analysis|reasoning|next_steps|reflection|interaction_plan)>([\s\S]*?)<\/\1>/gi;
        let match;

        while ((match = tagRegex.exec(text)) !== null) {
            // Thêm text trước thẻ
            if (match.index > lastIndex) {
                const beforeText = text.substring(lastIndex, match.index);
                if (beforeText.trim()) {
                    parts.push({ type: 'text', content: beforeText });
                }
            }

            // Thêm thẻ đã parse
            const tagType = match[1].toLowerCase();
            const tagContent = match[2].trim();
            parts.push({ type: tagType, content: tagContent });

            lastIndex = match.index + match[0].length;
        }

        // Thêm text còn lại sau thẻ cuối
        if (lastIndex < text.length) {
            const afterText = text.substring(lastIndex);
            if (afterText.trim()) {
                parts.push({ type: 'text', content: afterText });
            }
        }

        // Nếu không có thẻ nào, trả về toàn bộ text
        if (parts.length === 0) {
            parts.push({ type: 'text', content: text });
        }

        return parts;
    };

    // Parse các field trong thẻ (Screen:, Visible:, Target:, Action:, etc.)
    const parseTagFields = (content) => {
        const fields = [];
        const lines = content.split('\n').map(line => line.trim()).filter(line => line);

        lines.forEach(line => {
            // Match pattern: "Field: [value]"
            const fieldMatch = line.match(/^([^:]+):\s*(.+)$/);
            if (fieldMatch) {
                const fieldName = fieldMatch[1].trim();
                const fieldValue = fieldMatch[2].trim();
                fields.push({ name: fieldName, value: fieldValue });
            } else {
                // Nếu không match pattern, thêm như một dòng text thông thường
                if (line) {
                    fields.push({ name: null, value: line });
                }
            }
        });

        return fields;
    };

    const parts = parseContent(content);

    // Component to render markdown text
    const MarkdownText = ({ content }) => {
        // Split by code blocks first
        const codeBlockRegex = /```(\w+)?\n?([\s\S]*?)```/g;
        const textParts = [];
        let lastIndex = 0;
        let match;

        while ((match = codeBlockRegex.exec(content)) !== null) {
            // Add text before code block
            if (match.index > lastIndex) {
                const beforeText = content.substring(lastIndex, match.index);
                if (beforeText.trim()) {
                    textParts.push({ type: 'text', content: beforeText });
                }
            }

            // Add code block
            const language = match[1] || 'text';
            const code = match[2].trim();
            textParts.push({ type: 'code', language, content: code });

            lastIndex = match.index + match[0].length;
        }

        // Add remaining text
        if (lastIndex < content.length) {
            const afterText = content.substring(lastIndex);
            if (afterText.trim()) {
                textParts.push({ type: 'text', content: afterText });
            }
        }

        if (textParts.length === 0) {
            textParts.push({ type: 'text', content });
        }

        return (
            <div className="space-y-3">
                {textParts.map((textPart, textIndex) => {
                    if (textPart.type === 'code') {
                        return (
                            <CodeBlock
                                key={textIndex}
                                code={textPart.content}
                                language={textPart.language}
                            />
                        );
                    }

                    // Render markdown text
                    const lines = textPart.content.split('\n');
                    const elements = [];
                    let currentParagraph = [];
                    let inList = false;
                    let listItems = [];
                    let listType = null; // 'ul' or 'ol'

                    const flushParagraph = () => {
                        if (currentParagraph.length > 0) {
                            const text = currentParagraph.join(' ').trim();
                            if (text) {
                            elements.push(
                                <p key={elements.length} className="text-gray-900 dark:text-gray-100 text-sm sm:text-base leading-7 whitespace-pre-wrap break-words">
                                    {renderInlineMarkdown(text)}
                                </p>
                            );
                            }
                            currentParagraph = [];
                        }
                    };

                    const flushList = () => {
                        if (listItems.length > 0) {
                            const ListTag = listType === 'ol' ? 'ol' : 'ul';
                            elements.push(
                                <ListTag key={elements.length} className={`ml-4 ${listType === 'ol' ? 'list-decimal' : 'list-disc'} space-y-1 text-gray-900 dark:text-gray-100`}>
                                    {listItems.map((item, idx) => (
                                        <li key={idx} className="leading-7">
                                            {renderInlineMarkdown(item)}
                                        </li>
                                    ))}
                                </ListTag>
                            );
                            listItems = [];
                            inList = false;
                            listType = null;
                        }
                    };

                    lines.forEach((line, lineIndex) => {
                        const trimmed = line.trim();

                        // Headers
                        if (trimmed.match(/^#{1,6}\s/)) {
                            flushParagraph();
                            flushList();
                            const level = trimmed.match(/^(#+)/)[1].length;
                            const text = trimmed.substring(level).trim();
                            const Tag = `h${Math.min(level, 6)}`;
                            const sizes = { h1: 'text-2xl', h2: 'text-xl', h3: 'text-lg', h4: 'text-base', h5: 'text-sm', h6: 'text-xs' };
                            elements.push(
                                React.createElement(
                                    Tag,
                                    { key: elements.length, className: `${sizes[Tag]} font-bold text-gray-900 dark:text-gray-100 mt-4 mb-2` },
                                    renderInlineMarkdown(text)
                                )
                            );
                            return;
                        }

                        // Unordered list
                        if (trimmed.match(/^[-*+]\s/)) {
                            flushParagraph();
                            if (!inList || listType !== 'ul') {
                                flushList();
                                inList = true;
                                listType = 'ul';
                            }
                            listItems.push(trimmed.substring(2));
                            return;
                        }

                        // Ordered list
                        if (trimmed.match(/^\d+\.\s/)) {
                            flushParagraph();
                            if (!inList || listType !== 'ol') {
                                flushList();
                                inList = true;
                                listType = 'ol';
                            }
                            listItems.push(trimmed.replace(/^\d+\.\s/, ''));
                            return;
                        }

                        // Horizontal rule
                        if (trimmed.match(/^[-*_]{3,}$/)) {
                            flushParagraph();
                            flushList();
                            elements.push(<hr key={elements.length} className="my-4 border-gray-700" />);
                            return;
                        }

                        // Blockquote
                        if (trimmed.startsWith('> ')) {
                            flushParagraph();
                            flushList();
                            const quoteText = trimmed.substring(2);
                            elements.push(
                                <blockquote key={elements.length} className="border-l-4 border-gray-300 dark:border-gray-600 pl-4 italic text-gray-700 dark:text-gray-300 my-2">
                                    {renderInlineMarkdown(quoteText)}
                                </blockquote>
                            );
                            return;
                        }

                        // Regular line
                        if (trimmed) {
                            flushList();
                            currentParagraph.push(trimmed);
                        } else {
                            flushParagraph();
                        }
                    });

                    flushParagraph();
                    flushList();

                    return <div key={textIndex}>{elements}</div>;
                })}
            </div>
        );
    };

    // Render inline markdown (bold, italic, code, links)
    const renderInlineMarkdown = (text) => {
        const parts = [];
        let lastIndex = 0;

        // Match patterns: **bold**, *italic*, `code`, [link](url)
        const patterns = [
            { regex: /\*\*(.+?)\*\*/g, render: (match) => <strong key={lastIndex++} className="font-semibold text-gray-900 dark:text-gray-100">{match[1]}</strong> },
            { regex: /__(.+?)__/g, render: (match) => <strong key={lastIndex++} className="font-semibold text-gray-900 dark:text-gray-100">{match[1]}</strong> },
            { regex: /\*(.+?)\*/g, render: (match) => <em key={lastIndex++} className="italic">{match[1]}</em> },
            { regex: /_(.+?)_/g, render: (match) => <em key={lastIndex++} className="italic">{match[1]}</em> },
            { regex: /`(.+?)`/g, render: (match) => <code key={lastIndex++} className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-xs font-mono text-green-600 dark:text-green-400">{match[1]}</code> },
            { regex: /\[([^\]]+)\]\(([^)]+)\)/g, render: (match) => (
                <a key={lastIndex++} href={match[2]} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline">
                    {match[1]}
                </a>
            ) },
        ];

        // Find all matches
        const allMatches = [];
        patterns.forEach(({ regex, render }) => {
            let m;
            while ((m = regex.exec(text)) !== null) {
                allMatches.push({ index: m.index, length: m[0].length, match: m, render });
            }
        });

        // Sort by index
        allMatches.sort((a, b) => a.index - b.index);

        // Build parts
        allMatches.forEach(({ index, length, match, render }) => {
            if (index > lastIndex) {
                parts.push(text.substring(lastIndex, index));
            }
            parts.push(render(match));
            lastIndex = index + length;
        });

        if (lastIndex < text.length) {
            parts.push(text.substring(lastIndex));
        }

        return parts.length > 0 ? parts : text;
    };

    return (
        <div className="prose prose-invert max-w-none space-y-3 sm:space-y-4">
            {parts.map((part, index) => {
                if (part.type === 'text') {
                    // Parse markdown in text content
                    return <MarkdownText key={index} content={part.content} />;
                }

                // Render các thẻ thinking, analysis, reasoning, next_steps, reflection
                const fields = parseTagFields(part.content);
                const sectionId = `section-${index}`;
                const isCollapsed = collapsedSections.has(sectionId);

                const tagConfig = {
                    thinking: {
                        title: '💡 Thinking',
                        icon: '💡',
                        bgColor: 'bg-green-50 dark:bg-green-900/20',
                        borderColor: 'border-green-200 dark:border-green-800',
                        titleColor: 'text-green-700 dark:text-green-300',
                        fieldBg: 'bg-green-100 dark:bg-green-900/30',
                        hoverBg: 'hover:bg-green-100 dark:hover:bg-green-900/30'
                    },
                    analysis: {
                        title: '🔍 Analysis',
                        icon: '🔍',
                        bgColor: 'bg-blue-50 dark:bg-blue-900/20',
                        borderColor: 'border-blue-200 dark:border-blue-800',
                        titleColor: 'text-blue-700 dark:text-blue-300',
                        fieldBg: 'bg-blue-100 dark:bg-blue-900/30',
                        hoverBg: 'hover:bg-blue-100 dark:hover:bg-blue-900/30'
                    },
                    reasoning: {
                        title: '💭 Reasoning',
                        icon: '💭',
                        bgColor: 'bg-purple-50 dark:bg-purple-900/20',
                        borderColor: 'border-purple-200 dark:border-purple-800',
                        titleColor: 'text-purple-700 dark:text-purple-300',
                        fieldBg: 'bg-purple-100 dark:bg-purple-900/30',
                        hoverBg: 'hover:bg-purple-100 dark:hover:bg-purple-900/30'
                    },
                    next_steps: {
                        title: '🎯 Next Steps',
                        icon: '🎯',
                        bgColor: 'bg-orange-50 dark:bg-orange-900/20',
                        borderColor: 'border-orange-200 dark:border-orange-800',
                        titleColor: 'text-orange-700 dark:text-orange-300',
                        fieldBg: 'bg-orange-100 dark:bg-orange-900/30',
                        hoverBg: 'hover:bg-orange-100 dark:hover:bg-orange-900/30'
                    },
                    reflection: {
                        title: '🪞 Reflection',
                        icon: '🪞',
                        bgColor: 'bg-amber-50 dark:bg-amber-900/20',
                        borderColor: 'border-amber-200 dark:border-amber-800',
                        titleColor: 'text-amber-700 dark:text-amber-300',
                        fieldBg: 'bg-amber-100 dark:bg-amber-900/30',
                        hoverBg: 'hover:bg-amber-100 dark:hover:bg-amber-900/30'
                    },
                    interaction_plan: {
                        title: '📋 Interaction Plan',
                        icon: '📋',
                        bgColor: 'bg-indigo-50 dark:bg-indigo-900/20',
                        borderColor: 'border-indigo-200 dark:border-indigo-800',
                        titleColor: 'text-indigo-700 dark:text-indigo-300',
                        fieldBg: 'bg-indigo-100 dark:bg-indigo-900/30',
                        hoverBg: 'hover:bg-indigo-100 dark:hover:bg-indigo-900/30'
                    }
                };

                const config = tagConfig[part.type] || tagConfig.analysis;

                const toggleCollapse = () => {
                    setCollapsedSections(prev => {
                        const newSet = new Set(prev);
                        if (newSet.has(sectionId)) {
                            newSet.delete(sectionId);
                        } else {
                            newSet.add(sectionId);
                        }
                        return newSet;
                    });
                };

                // Render markdown-like formatting (bold, italic, code)
                const renderFormattedText = (text) => {
                    // Handle bold **text** or __text__
                    text = text.replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-gray-900 dark:text-gray-100">$1</strong>');
                    text = text.replace(/__(.+?)__/g, '<strong class="font-semibold text-gray-900 dark:text-gray-100">$1</strong>');
                    // Handle italic *text* or _text_
                    text = text.replace(/\*(.+?)\*/g, '<em class="italic">$1</em>');
                    text = text.replace(/_(.+?)_/g, '<em class="italic">$1</em>');
                    // Handle inline code `code`
                    text = text.replace(/`(.+?)`/g, '<code class="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-xs font-mono text-green-600 dark:text-green-400">$1</code>');
                    // Handle line breaks
                    text = text.replace(/\n/g, '<br />');
                    return { __html: text };
                };

                return (
                    <div
                        key={index}
                        className={`rounded-lg border ${config.borderColor} ${config.bgColor} transition-all duration-200 ${config.hoverBg} w-full`}
                    >
                        {/* Header - Clickable để collapse/expand */}
                        <button
                            onClick={toggleCollapse}
                            className={`w-full px-3 sm:px-4 py-2 sm:py-3 flex items-center justify-between transition-colors ${config.hoverBg} rounded-t-lg touch-manipulation`}
                            aria-expanded={!isCollapsed}
                        >
                            <div className={`flex items-center space-x-1 sm:space-x-2 ${config.titleColor} font-semibold text-xs sm:text-sm flex-1 min-w-0`}>
                                <span className="text-base sm:text-lg shrink-0">{config.icon}</span>
                                <span className="truncate">{config.title}</span>
                            </div>
                            <svg
                                className={`w-3 h-3 sm:w-4 sm:h-4 ${config.titleColor} transition-transform duration-200 shrink-0 ml-2 ${isCollapsed ? '' : 'rotate-90'}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>

                        {/* Content - Collapsible với animation */}
                        <div
                            className={`overflow-hidden transition-all duration-300 ease-in-out ${
                                isCollapsed ? 'max-h-0 opacity-0' : 'max-h-[5000px] opacity-100'
                            }`}
                        >
                            <div className="px-3 sm:px-4 pb-3 sm:pb-4 pt-2 space-y-2 sm:space-y-3">
                                {fields.length > 0 ? (
                                    <div className="space-y-2">
                                        {fields.map((field, fieldIndex) => {
                                            if (field.name === null) {
                                                // Text line không có field name - render với formatting
                                                return (
                                                    <p
                                                        key={fieldIndex}
                                                        className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed"
                                                        dangerouslySetInnerHTML={renderFormattedText(field.value)}
                                                    />
                                                );
                                            }

                                            // Field với name và value
                                            return (
                                                <div
                                                    key={fieldIndex}
                                                    className={`rounded-md ${config.fieldBg} p-2 sm:p-3 border ${config.borderColor} border-opacity-20 transition-colors hover:border-opacity-40`}
                                                >
                                                    <div className="flex flex-col sm:flex-row sm:items-start sm:space-x-2 space-y-1 sm:space-y-0">
                                                        <span className={`${config.titleColor} font-medium text-xs uppercase tracking-wide shrink-0 sm:min-w-[80px]`}>
                                                            {field.name}:
                                                        </span>
                                                        <span
                                                            className="text-gray-700 dark:text-gray-200 text-xs sm:text-sm leading-relaxed flex-1 break-words"
                                                            dangerouslySetInnerHTML={renderFormattedText(field.value || 'N/A')}
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <p
                                        className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed"
                                        dangerouslySetInnerHTML={renderFormattedText(part.content)}
                                    />
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

