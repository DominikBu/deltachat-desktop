const React = require('react')
const { ipcRenderer } = require('electron')

const ContactListItem = require('./ContactListItem')

const {
  Alignment,
  Classes,
  Navbar,
  NavbarGroup,
  NavbarHeading,
  Button
} = require('@blueprintjs/core')

class CreateChat extends React.Component {
  shouldComponentUpdate (nextProps, nextState) {
    // we don't care about the props for now, really.
    return (this.state !== nextState)
  }

  createGroup () {
    this.props.changeScreen('CreateGroup')
  }

  chooseContact (contact) {
    var chatId = ipcRenderer.sendSync('dispatchSync', 'createChatByContactId', contact.id)
    if (!chatId) return this.props.userFeedback({ type: 'error', text: `Invalid contact id ${contact.id}` })
    this.props.changeScreen('ChatView', { chatId })
  }

  render () {
    const { deltachat } = this.props

    return (
      <div>
        <Navbar fixedToTop>
          <NavbarGroup align={Alignment.LEFT}>
            <Button className={Classes.MINIMAL} icon='undo' onClick={this.props.changeScreen} />
            <NavbarHeading>Create Chat</NavbarHeading>
          </NavbarGroup>
          <NavbarGroup align={Alignment.RIGHT}>
            <Button
              className={Classes.MINIMAL}
              icon='plus'
              onClick={this.createGroup.bind(this)}
              text='Group' />
          </NavbarGroup>
        </Navbar>
        <div className='window'>
          {deltachat.contacts.map((contact) => {
            return (<ContactListItem
              contact={contact}
              onClick={this.chooseContact.bind(this)}
            />
            )
          })}
        </div>
      </div>
    )
  }
}

module.exports = CreateChat
