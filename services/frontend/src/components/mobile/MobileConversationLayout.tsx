'use client';

import { Pause, Settings } from 'lucide-react';
import { useState, useCallback, ChangeEvent, KeyboardEvent, FC } from 'react';
import { PendingResponse } from '@/components/chat/ChatInterface';
import ChatPanel from '@/components/mobile/ChatPanel';
import ResponsePanel from '@/components/mobile/ResponsePanel';
import { useViewportHeight } from '@/hooks/useViewportHeight';
import { useTranslations } from '@/i18n';
import { ChatMessage } from '@/types/chatHistory';

type ActivePanel = 'chat' | 'responses';

interface MobileConversationLayoutProps {
  textInput: string;
  onTextInputChange: (value: string) => void;
  onSendMessage: () => void;
  frozenResponses: PendingResponse[] | null;
  onFreezeToggle: () => void;
  pendingResponses: PendingResponse[];
  onResponseEdit?: (text: string) => void;
  onResponseSelect: (responseId: string) => void;
  onConnectButtonPress: () => void;
  onSettingsPress: () => void;
  chatHistory: ChatMessage[];
  isConnected: boolean;
  currentSpeakerMessage?: string;
}

const QUICK_RESPONSES = ['Yes', 'No', 'Ok', 'Tell me more'];

const MobileConversationLayout: FC<MobileConversationLayoutProps> = ({
  textInput,
  onTextInputChange,
  onSendMessage,
  frozenResponses,
  onFreezeToggle,
  pendingResponses,
  onResponseEdit = undefined,
  onResponseSelect,
  onConnectButtonPress,
  onSettingsPress,
  chatHistory,
  isConnected,
  currentSpeakerMessage = '',
}) => {
  const t = useTranslations();
  const [activePanel, setActivePanel] = useState<ActivePanel>('chat');
  const { vh, visualVh } = useViewportHeight();
  const keyboardHeight = Math.max(0, vh - visualVh);

  const onMessageChange = useCallback(
    (event: ChangeEvent<HTMLTextAreaElement>) => {
      onTextInputChange(event.target.value);
    },
    [onTextInputChange],
  );
  const onMessageKeyDown = useCallback(
    (event: KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        onSendMessage();
      }
    },
    [onSendMessage],
  );

  // When user taps Edit on a response card: fill the text input and switch to chat tab
  const handleEditResponse = useCallback(
    (text: string) => {
      onTextInputChange(text);
      setActivePanel('chat');
    },
    [onTextInputChange],
  );

  // Top 2 complete LLM suggestions to show above the text input
  const responsesToShow = frozenResponses ?? pendingResponses;
  const topSuggestions = responsesToShow
    .filter((r) => r.text.trim() && r.isComplete)
    .slice(0, 2);

  return (
    <div
      className='w-full flex flex-col bg-[#121212] text-white overflow-hidden'
      style={{
        height: `${vh}px`,
        paddingBottom: keyboardHeight > 0 ? `${keyboardHeight}px` : undefined,
      }}
    >
      {/* Safe area spacer for notch/status bar */}
      <div style={{ height: 'var(--safe-area-inset-top)' }} className='shrink-0' />

      {/* Header with stop button - fixed height */}
      <div className='flex items-center justify-between px-4 py-3 shrink-0 h-[60px]'>
        <button
          aria-label='Stop conversation'
          className='shrink-0 h-11 p-px cursor-pointer orange-to-light-orange-gradient rounded-2xl'
          onClick={onConnectButtonPress}
          title={t('conversation.stopConversation')}
        >
          <div className='h-full w-full flex flex-row bg-[#181818] items-center justify-center gap-2 rounded-2xl text-sm px-5'>
            {t('conversation.stopConversation')}
            <Pause
              width={24}
              height={24}
              className='shrink-0 text-white'
            />
          </div>
        </button>
        <button
          className='shrink-0 h-11 p-px cursor-pointer orange-to-light-orange-gradient rounded-2xl'
          onClick={onSettingsPress}
          title={t('settings.changeSettings')}
        >
          <div className='h-full w-full flex flex-row bg-[#181818] items-center justify-center rounded-2xl px-3'>
            <Settings size={20} />
          </div>
        </button>
      </div>

      {/* Tab bar */}
      <div className='flex border-b border-gray-700 shrink-0'>
        <button
          className={`flex-1 py-3 min-h-[44px] text-sm font-medium transition-colors ${
            activePanel === 'chat'
              ? 'text-blue-400 border-b-2 border-blue-400'
              : 'text-gray-400 hover:text-gray-200'
          }`}
          onClick={() => setActivePanel('chat')}
        >
          Chat
        </button>
        <button
          className={`flex-1 py-3 min-h-[44px] text-sm font-medium transition-colors ${
            activePanel === 'responses'
              ? 'text-blue-400 border-b-2 border-blue-400'
              : 'text-gray-400 hover:text-gray-200'
          }`}
          onClick={() => setActivePanel('responses')}
        >
          Responses
        </button>
      </div>

      {/* Main panel — flex-1 min-h-0 ensures it fills remaining space without overflow */}
      <div className='flex-1 min-h-0 flex flex-col'>
        {activePanel === 'chat' && (
          <ChatPanel
            chatHistory={chatHistory}
            isConnected={isConnected}
            currentSpeakerMessage={currentSpeakerMessage}
          />
        )}
        {activePanel === 'responses' && (
          <ResponsePanel
            frozenResponses={frozenResponses}
            onFreezeToggle={onFreezeToggle}
            pendingResponses={pendingResponses}
            onResponseEdit={onResponseEdit}
            onResponseSelect={onResponseSelect}
            onEditResponseInChat={handleEditResponse}
          />
        )}
      </div>

      {/* Always-visible text input footer */}
      <div className='px-4 pt-2 pb-1 border-t border-gray-700 shrink-0'>
        {/* Top LLM suggestions (up to 2) — tap to select without switching tabs */}
        {topSuggestions.length > 0 && (
          <div className='flex gap-2 mb-2 overflow-x-auto no-scrollbar'>
            {topSuggestions.map((r) => (
              <button
                key={r.id}
                className='shrink-0 px-3 min-h-[36px] bg-gray-800 border border-gray-600 rounded-full text-sm text-gray-200 hover:bg-gray-700 transition-colors max-w-[45vw] truncate'
                onClick={() => onResponseSelect(r.id)}
                title={r.text}
              >
                {r.text}
              </button>
            ))}
          </div>
        )}
        <div className='flex gap-2 pb-1'>
          <textarea
            className='flex-1 p-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm'
            placeholder={t('conversation.typeMessagePlaceholder')}
            rows={2}
            value={textInput}
            onChange={onMessageChange}
            onKeyDown={onMessageKeyDown}
          />
          <button
            className='px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 text-sm min-w-[56px] min-h-[44px]'
            onClick={onSendMessage}
            disabled={!textInput.trim()}
          >
            Send
          </button>
        </div>
      </div>

      {/* Safe area spacer for home indicator */}
      <div style={{ height: 'var(--safe-area-inset-bottom)' }} className='shrink-0' />
    </div>
  );
};

export default MobileConversationLayout;
