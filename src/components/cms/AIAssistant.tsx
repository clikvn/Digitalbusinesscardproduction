import React, { useState, useRef, useEffect } from "react";
import { ArrowUp, Plus, Mic, ThumbsUp, ThumbsDown, Copy, RotateCw, Menu, X } from "lucide-react";
import { Button } from "../ui/button";
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface AIAgentProps {
  fieldLabel: string;
  currentValue: string;
  onApply: (value: string) => void;
  initialMessage?: string;
  threadId?: string | null;
  onThreadUpdate?: () => void;
  // Thread management props
  threads?: any[];
  currentThreadId?: string | null;
  onSelectThread?: (threadId: string) => void;
  onNewThread?: () => void;
  onDeleteThread?: (threadId: string) => void;
  // Show menu button
  showThreadsMenu?: boolean;
  onThreadsMenuClick?: () => void;
  // External control of threads panel
  threadsOpen?: boolean;
  onThreadsOpenChange?: (open: boolean) => void;
  // Tab state management
  activeTab?: 'ai' | 'products' | 'favourite';
  onTabChange?: (tab: 'ai' | 'products' | 'favourite') => void;
}

/**
 * AI Assistant Component - Chat Interface
 */
export function AIAssistant({ 
  fieldLabel,
  showThreadsMenu = false,
  onThreadsMenuClick,
  activeTab = 'ai',
  onTabChange,
}: AIAgentProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hello! I'm your showroom assistant. How can I help you today?",
      timestamp: Date.now(),
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false); // Track if user is in typing mode
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Speech Recognition
  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition
  } = useSpeechRecognition();

  // Sync transcript with input value while listening
  useEffect(() => {
    if (listening && transcript) {
      setInputValue(transcript);
    }
  }, [transcript, listening]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-resize textarea as user types
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // If input is empty and not recording, keep it at 1 line (24px)
    if (!inputValue.trim() && !listening) {
      textarea.style.height = '24px';
      return;
    }

    // Reset height to auto to get the correct scrollHeight
    textarea.style.height = 'auto';
    
    // Calculate new height (max 4 lines = 96px with 24px line-height)
    const newHeight = Math.min(textarea.scrollHeight, 96);
    textarea.style.height = `${newHeight}px`;
  }, [inputValue, listening]);

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    
    // Reset textarea height after sending
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    // Simulate AI response (replace with actual API call)
    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I'm here to help! This is a placeholder response. The AI integration will be connected soon.",
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, aiMessage]);
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleCopyMessage = (content: string) => {
    try {
      // Try modern Clipboard API first
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(content).catch(() => {
          fallbackCopy(content);
        });
      } else {
        fallbackCopy(content);
      }
    } catch (error) {
      console.error('[AIAssistant] Copy failed:', error);
      fallbackCopy(content);
    }
  };

  const fallbackCopy = (text: string) => {
    // Fallback method using textarea
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.left = '-999999px';
    textarea.style.top = '-999999px';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    try {
      document.execCommand('copy');
      console.log('[AIAssistant] Text copied using fallback method');
    } catch (error) {
      console.error('[AIAssistant] Fallback copy failed:', error);
    }
    textarea.remove();
  };

  const handleRegenerateResponse = () => {
    // Placeholder for regenerate functionality
    console.log('Regenerate response');
  };

  const handleVoiceInput = () => {
    if (!listening) {
      // Start listening with continuous mode
      SpeechRecognition.startListening({
        continuous: true, // Keep listening during pauses
        language: 'en-US'
      });
    } else {
      // Stop listening
      SpeechRecognition.stopListening();
      // Keep transcript in input
      setInputValue(transcript);
      // Reset
      resetTranscript();
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#FAF9F5]">
      {/* Messages Container */}
      <div 
        className="flex-1 overflow-y-auto"
        style={{
          paddingTop: '11.99px',
          paddingLeft: '15.99px',
          paddingRight: '15.99px',
        }}
      >
        <div className="flex flex-col" style={{ gap: '16px' }}>
          {messages.map((message) => (
            <div key={message.id} className="flex flex-col" style={{ gap: '16px' }}>
              {/* Message Content */}
              <div 
                className={`${
                  message.role === 'user' 
                    ? 'ml-auto bg-[#E9E6DC] rounded-[24px] max-w-[80%]' 
                    : 'mr-auto max-w-full'
                }`}
                style={{
                  fontFamily: 'Arial',
                  fontSize: '16px',
                  lineHeight: '24px',
                  fontWeight: 400,
                  color: '#3D3929',
                  padding: message.role === 'user' ? '12px 16px' : '0px',
                }}
              >
                {message.content}
              </div>

              {/* Message Actions - Only for assistant messages */}
              {message.role === 'assistant' && (
                <div className="flex items-center" style={{ gap: '0px' }}>
                  <button
                    onClick={() => handleCopyMessage(message.content)}
                    className="rounded-[6px] flex items-center justify-center hover:bg-[#ebebeb]/30 transition-colors"
                    style={{ width: '43.99px', height: '43.99px' }}
                    aria-label="Copy"
                  >
                    <Copy className="text-[#83827D]" style={{ width: '16px', height: '16px' }} strokeWidth={1} />
                  </button>
                  <button
                    className="rounded-[6px] flex items-center justify-center hover:bg-[#ebebeb]/30 transition-colors"
                    style={{ width: '43.99px', height: '43.99px' }}
                    aria-label="Like"
                  >
                    <ThumbsUp className="text-[#83827D]" style={{ width: '16px', height: '16px' }} strokeWidth={1} />
                  </button>
                  <button
                    className="rounded-[6px] flex items-center justify-center hover:bg-[#ebebeb]/30 transition-colors"
                    style={{ width: '43.99px', height: '43.99px' }}
                    aria-label="Dislike"
                  >
                    <ThumbsDown className="text-[#83827D]" style={{ width: '16px', height: '16px' }} strokeWidth={1} />
                  </button>
                  <button
                    onClick={handleRegenerateResponse}
                    className="rounded-[6px] flex items-center justify-center hover:bg-[#ebebeb]/30 transition-colors"
                    style={{ width: '43.99px', height: '43.99px' }}
                    aria-label="Regenerate"
                  >
                    <RotateCw className="text-[#83827D]" style={{ width: '16px', height: '16px' }} strokeWidth={1} />
                  </button>
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Chat Input */}
      <div className="bg-[#FAF9F5]" style={{ paddingLeft: '11.99px', paddingRight: '11.99px', paddingBottom: '12px' }}>
        <div className="flex items-end" style={{ gap: '7.99px' }}>
          {/* Attachment Button */}
          <button
            className="shrink-0 rounded-full bg-[#FAF9F5] flex items-center justify-center hover:bg-[#ebebeb]/30 transition-colors"
            style={{ 
              width: '43.99px', 
              height: '43.99px',
              border: '0.693px solid #DAD9D4',
            }}
            aria-label="Attach"
          >
            <Plus className="text-[#3D3D3A]" style={{ width: '16px', height: '16px' }} strokeWidth={1.33} />
          </button>

          {/* Input Container */}
          <div 
            className="flex-1 flex flex-col rounded-[24px] bg-[#FAF9F5]"
            style={{ 
              border: '0.693px solid #DAD9D4',
              paddingLeft: '16px',
              paddingRight: '4px',
              paddingTop: '4px',
              paddingBottom: '4px',
              gap: '4px',
            }}
          >
            {/* Top Row: Textarea + Buttons (when not recording) */}
            <div className="flex items-end" style={{ gap: '8px' }}>
              {/* Textarea - Always visible */}
              <textarea
                ref={textareaRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyPress}
                onFocus={() => setIsTyping(true)}
                onBlur={() => setIsTyping(false)}
                placeholder="Hi, I'm your showroom assistant"
                className="flex-1 bg-transparent outline-none resize-none overflow-hidden scrollbar-hide"
                style={{
                  fontFamily: 'Arial',
                  fontSize: '16px',
                  lineHeight: '24px',
                  fontWeight: 400,
                  color: inputValue ? '#3D3D3A' : '#7A776C',
                  paddingTop: '6px',
                  paddingBottom: '6px',
                  minHeight: '36px',
                }}
                rows={1}
              />

              {/* Voice and Send Buttons - Show on same line when not recording */}
              {!listening && (
                <>
                  {/* Hide mic button when user is typing */}
                  {!isTyping && (
                    <button
                      onClick={handleVoiceInput}
                      className="shrink-0 rounded-full flex items-center justify-center transition-colors bg-[#FAF9F5] text-[#3D3D3A]"
                      style={{ width: '36px', height: '36px' }}
                      aria-label="Voice input"
                    >
                      <Mic style={{ width: '20px', height: '20px' }} strokeWidth={1.67} />
                    </button>
                  )}
                  <button
                    onClick={handleSendMessage}
                    disabled={!inputValue.trim()}
                    className={`shrink-0 rounded-full flex items-center justify-center transition-colors ${
                      inputValue.trim() 
                        ? 'bg-[#c96442] text-white' 
                        : 'bg-[#ebebeb] text-[#7A776C]'
                    }`}
                    style={{ width: '36px', height: '36px' }}
                    aria-label="Send"
                  >
                    <ArrowUp style={{ width: '20px', height: '20px' }} strokeWidth={2.08} />
                  </button>
                </>
              )}
            </div>

            {/* Bottom Row: Voice Visualization + Buttons (only when listening) */}
            {listening && (
              <div className="flex items-center" style={{ gap: '8px' }}>
                {/* Animated Voice Bars Visualization */}
                <div className="flex-1 flex items-center justify-center" style={{ gap: '3px', height: '36px' }}>
                  {[...Array(20)].map((_, i) => (
                    <div
                      key={i}
                      className="bg-[#3D3D3A] rounded-full"
                      style={{
                        width: '2px',
                        height: `${12 + Math.random() * 24}px`,
                        animation: `pulse ${0.8 + Math.random() * 0.4}s ease-in-out infinite alternate`,
                        animationDelay: `${i * 0.05}s`,
                      }}
                    />
                  ))}
                </div>

                {/* Voice and Send Buttons */}
                <button
                  onClick={handleVoiceInput}
                  className="shrink-0 rounded-full flex items-center justify-center transition-colors bg-[#c96442] text-white"
                  style={{ width: '36px', height: '36px' }}
                  aria-label="Stop recording"
                >
                  <Mic style={{ width: '20px', height: '20px' }} strokeWidth={1.67} />
                </button>
                <button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim()}
                  className={`shrink-0 rounded-full flex items-center justify-center transition-colors ${
                    inputValue.trim() 
                      ? 'bg-[#c96442] text-white' 
                      : 'bg-[#ebebeb] text-[#7A776C]'
                  }`}
                  style={{ width: '36px', height: '36px' }}
                  aria-label="Send"
                >
                  <ArrowUp style={{ width: '20px', height: '20px' }} strokeWidth={2.08} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}