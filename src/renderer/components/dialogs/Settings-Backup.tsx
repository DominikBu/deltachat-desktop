import React, { useState, useEffect } from 'react'
import {
  Card,
  Elevation,
  H5,
  Classes,
  ProgressBar,
  Intent,
  H2,
} from '@blueprintjs/core'
import { SettingsButton } from './Settings'
import { OpenDialogOptions } from 'electron'
import { ipcBackend } from '../../ipc'
import { DialogProps } from './DialogController'
import DeltaDialog, { DeltaDialogBody, DeltaDialogContent, SmallDialog } from './DeltaDialog'
import { isOpen } from '@blueprintjs/core/lib/esm/components/context-menu/contextMenu'
import { DeltaProgressBar } from '../Login-Styles'

const { remote } = window.electron_functions


function ExportProgressDialog(props: DialogProps) {
  const userFeedback = window.__userFeedback
  const tx = window.translate

  const [progress, setProgress] = useState(0.0)

  const onFileWritten = (_event: any, [_, filename]: [any, string]) => {
    userFeedback({
      type: 'success',
      text: tx('pref_backup_written_to_x', filename),
    })
    props.onClose()
  }

  const onImexProgress = (_: any, [progress, data2] : [number,number]) => {
    setProgress(progress)
  }
  useEffect(() => {
    ipcBackend.once('DC_EVENT_IMEX_FILE_WRITTEN', onFileWritten)
    ipcBackend.on('DC_EVENT_IMEX_PROGRESS', onImexProgress)

    return () => {
      ipcBackend.removeListener('DC_EVENT_IMEX_FILE_WRITTEN', onFileWritten)
      ipcBackend.removeListener('DC_EVENT_IMEX_PROGRESS', onImexProgress)
    }
  }, [])

  return (
    <SmallDialog
      isOpen={props.isOpen}
      onClose={() => {}}
    >
      <DeltaDialogBody>
        <DeltaDialogContent>
          <H5 style={{marginTop:'20px'}}>Exporting backup...</H5>
          <DeltaProgressBar 
            intent={Intent.PRIMARY}
            progress={progress}
          />
        </DeltaDialogContent>
        
      </DeltaDialogBody>
    </SmallDialog>
  )
}

function onBackupExport() {
  const tx = window.translate
  const userFeedback = window.__userFeedback
  const closeDialog = window.__closeDialog
  const openDialog = window.__openDialog

  const confirmOpts = {
    buttons: [tx('cancel'), tx('export_backup_desktop')],
  }
  openDialog('ConfirmationDialog', {
    message: tx('pref_backup_export_explain'),
    yesIsPrimary: true,
    confirmLabel: tx('ok'),
    cb: (yes: boolean) => {
      if (!yes) return
      const opts: OpenDialogOptions = {
        title: tx('export_backup_desktop'),
        defaultPath: remote.app.getPath('downloads'),
        properties: ['openDirectory'],
      }
      remote.dialog.showOpenDialog(opts, (filenames: string[]) => {
        if (!filenames || !filenames.length) return
        openDialog(ExportProgressDialog)
        ipcBackend.send('backupExport', filenames[0])
      })
    },
  })
}

export default function SettingsBackup() {
  const tx = window.translate
  return (
    <>
      <Card elevation={Elevation.ONE}>
        <H5>{tx('pref_backup')}</H5>
        <SettingsButton onClick={onBackupExport}>
          {tx('pref_backup_export_start_button')}
        </SettingsButton>
      </Card>
    </>
  )
}
