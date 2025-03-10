import React, { useState, useContext, useRef } from 'react'
import { ScreenContext, useTranslationFunction } from '../../contexts'

import Gallery from '../Gallery'
import { useThreeDotMenu } from '../ThreeDotMenu'
import ChatList from '../chat/ChatList'
import MessageListAndComposer, {
  getBackgroundImageStyle,
} from '../message/MessageListAndComposer'
import SearchInput from '../SearchInput'
import { useChatStore, ChatStoreStateWithChatSet } from '../../stores/chat'
import {
  openViewGroupDialog,
  openViewProfileDialog,
  selectChat,
} from '../helpers/ChatMethods'

import {
  Alignment,
  Classes,
  Navbar,
  NavbarGroup,
  NavbarHeading,
  Button,
  Icon,
} from '@blueprintjs/core'
import { getLastSelectedChatId } from '../../ipc'
import { useKeyBindingAction, KeybindAction } from '../../keybindings'
import { Avatar } from '../Avatar'
import ConnectivityToast from '../ConnectivityToast'
import { C } from 'deltachat-node/dist/constants'
import MapComponent from '../map/MapComponent'
import MailingListProfile from '../dialogs/MessageListProfile'
import { FullChat } from '../../../shared/shared-types'
import { getLogger } from '../../../shared/logger'
import { RecoverableCrashScreen } from './RecoverableCrashScreen'
import Sidebar, { SidebarState } from '../Sidebar'
import SettingsStoreInstance, { useSettingsStore } from '../../stores/settings'

const log = getLogger('renderer/main-screen')

export enum View {
  MessageList,
  Media,
  Map,
}

export default function MainScreen() {
  const [queryStr, setQueryStr] = useState('')
  const [view, setView] = useState(View.MessageList)
  const [sidebarState, setSidebarState] = useState<SidebarState>('init')
  window.__setMainScreenView = setView
  const [showArchivedChats, setShowArchivedChats] = useState(false)
  // Small hack/misuse of keyBindingAction to setShowArchivedChats from other components (especially
  // ViewProfile when selecting a shared chat/group)
  useKeyBindingAction(KeybindAction.ChatList_SwitchToArchiveView, () =>
    setShowArchivedChats(true)
  )
  useKeyBindingAction(KeybindAction.ChatList_SwitchToNormalView, () =>
    setShowArchivedChats(false)
  )

  const screenContext = useContext(ScreenContext)
  const selectedChat = useChatStore()

  const onChatClick = (chatId: number) => {
    if (chatId === C.DC_CHAT_ID_ARCHIVED_LINK) return setShowArchivedChats(true)
    // avoid double clicks
    if (chatId === selectedChat.chat?.id) return

    selectChat(chatId)
    setView(View.MessageList)
  }
  const searchChats = (queryStr: string) => setQueryStr(queryStr)
  const handleSearchChange = (event: { target: { value: string } }) =>
    searchChats(event.target.value)
  const onTitleClick = () => {
    if (!selectedChat.chat) return

    if (selectedChat.chat.type === C.DC_CHAT_TYPE_MAILINGLIST) {
      screenContext.openDialog(MailingListProfile, {
        chat: selectedChat.chat,
      })
    } else if (selectedChat.chat.isGroup) {
      openViewGroupDialog(screenContext, selectedChat.chat)
    } else {
      if (selectedChat.chat.contactIds && selectedChat.chat.contactIds[0]) {
        openViewProfileDialog(screenContext, selectedChat.chat.contactIds[0])
      }
    }
  }

  window.__chatlistSetSearch = searchChats

  const [isFirstLoad, setFirstLoad] = useState(true)
  if (isFirstLoad) {
    setFirstLoad(false)
    const lastChatId = getLastSelectedChatId()
    if (lastChatId) {
      selectChat(lastChatId)
    }
    SettingsStoreInstance.effect.load()
  }

  const tx = useTranslationFunction()
  const settingsStore = useSettingsStore()[0]

  const searchRef = useRef<HTMLInputElement>(null)

  useKeyBindingAction(KeybindAction.ChatList_FocusSearchInput, () => {
    searchRef.current?.focus()
  })

  useKeyBindingAction(KeybindAction.ChatList_ClearSearchInput, () => {
    if (!searchRef.current) {
      return
    }
    searchRef.current.value = ''
    searchChats('')
  })
  const onClickThreeDotMenu = useThreeDotMenu(selectedChat.chat)

  if (!selectedChat) {
    log.error('selectedChat is undefined')
    return null
  }

  let MessageListView
  if (selectedChat.chat !== null) {
    switch (view) {
      case View.Media:
        MessageListView = <Gallery chatId={selectedChat.chat.id} />
        break
      case View.Map:
        MessageListView = <MapComponent selectedChat={selectedChat.chat} />
        break
      case View.MessageList:
      default:
        MessageListView = (
          <RecoverableCrashScreen reset_on_change_key={selectedChat.chat.id}>
            <MessageListAndComposer
              chatStore={selectedChat as ChatStoreStateWithChatSet}
            />
          </RecoverableCrashScreen>
        )
    }
  } else {
    const style: React.CSSProperties = settingsStore
      ? getBackgroundImageStyle(settingsStore.desktopSettings)
      : {}

    MessageListView = (
      <div className='message-list-and-composer' style={style}>
        <div
          className='message-list-and-composer__message-list'
          style={{ display: 'flex' }}
        >
          <div className='info-message big' style={{ alignSelf: 'center' }}>
            <div className='bubble'>
              {tx('no_chat_selected_suggestion_desktop')}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // StandardJS won't let me use '&& { } || { }', so the following code
  // compares with showArchivedChats twice.
  return (
    <div className='main-screen'>
      <div className='navbar-wrapper'>
        <Navbar fixedToTop>
          <NavbarGroup align={Alignment.LEFT}>
            <div
              className='sidebar-icon'
              onClick={() => setSidebarState('visible')}
            >
              <Icon icon='menu' aria-label={tx('main_menu')} iconSize={20} />
            </div>
            {queryStr.length === 0 && showArchivedChats && (
              <>
                <div className='archived-chats-title'>
                  {tx('chat_archived_chats_title')}
                </div>
                <Button
                  className={[
                    Classes.MINIMAL,
                    'icon-rotated',
                    'archived-chats-return-button',
                  ].join(' ')}
                  icon='undo'
                  onClick={() => setShowArchivedChats(false)}
                  aria-label={tx('back')}
                />
              </>
            )}
            {(showArchivedChats && queryStr.length === 0) || (
              <SearchInput
                id='chat-list-search'
                onChange={handleSearchChange}
                value={queryStr}
                className='icon-rotated'
                inputRef={searchRef}
              />
            )}
          </NavbarGroup>
          <NavbarGroup align={Alignment.RIGHT}>
            {selectedChat.chat && (
              <NavbarHeading
                style={{
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  width: '100%',
                }}
                onClick={onTitleClick}
              >
                <Avatar
                  displayName={selectedChat.chat.name}
                  color={selectedChat.chat.color}
                  isVerified={selectedChat.chat.isProtected}
                  avatarPath={selectedChat.chat.profileImage || undefined}
                  small
                />
                <div style={{ marginLeft: '7px' }}>
                  <div className='navbar-chat-name'>
                    {selectedChat.chat.name}
                    {selectedChat.chat.ephemeralTimer !== 0 && (
                      <div
                        className={'disapearing-messages-icon'}
                        aria-label={tx('a11y_disappearing_messages_activated')}
                      />
                    )}
                  </div>
                  <div className='navbar-chat-subtile'>
                    {chatSubtitle(selectedChat.chat)}
                  </div>
                </div>
              </NavbarHeading>
            )}
            {selectedChat.chat && (
              <span className='views'>
                <Button
                  onClick={() => setView(View.MessageList)}
                  minimal
                  large
                  active={view === View.MessageList}
                  // aria-selected={!view}
                  icon={'chat'}
                  aria-label={tx('chat')}
                />
                <Button
                  onClick={() => setView(View.Media)}
                  minimal
                  large
                  active={view === View.Media}
                  // aria-selected={view}
                  icon={'media'}
                  aria-label={tx('media')}
                />
                {settingsStore?.desktopSettings
                  .enableOnDemandLocationStreaming && (
                  <Button
                    minimal
                    large
                    icon='map'
                    onClick={() => setView(View.Map)}
                    active={view === View.Map}
                    aria-label={tx('tab_map')}
                  />
                )}
              </span>
            )}
            <span
              style={{
                marginLeft:
                  selectedChat.chat && selectedChat.chat.id ? 0 : 'auto',
                marginRight: '3px',
              }}
            >
              <Button
                className='icon-rotated'
                minimal
                icon='more'
                id='main-menu-button'
                aria-label={tx('main_menu')}
                onClick={onClickThreeDotMenu}
              />
            </span>
          </NavbarGroup>
        </Navbar>
      </div>
      <div>
        <ChatList
          queryStr={queryStr}
          showArchivedChats={showArchivedChats}
          onChatClick={onChatClick}
          selectedChatId={selectedChat.chat ? selectedChat.chat.id : null}
        />
        {MessageListView}
      </div>
      <Sidebar sidebarState={sidebarState} setSidebarState={setSidebarState} />
      <ConnectivityToast />
    </div>
  )
}

function chatSubtitle(chat: FullChat) {
  const tx = window.static_translate
  if (chat.id && chat.id > C.DC_CHAT_ID_LAST_SPECIAL) {
    if (chat.type === C.DC_CHAT_TYPE_GROUP) {
      return tx('n_members', [String(chat.contacts.length)], {
        quantity: chat.contacts.length,
      })
    } else if (chat.type === C.DC_CHAT_TYPE_MAILINGLIST) {
      return tx('mailing_list')
    } else if (chat.contacts.length >= 1) {
      if (chat.isSelfTalk) {
        return tx('chat_self_talk_subtitle')
      } else if (chat.isDeviceChat) {
        return tx('device_talk_subtitle')
      }
      return chat.contacts[0].address
    }
  }
  return 'ErrTitle'
}
