// Native pickers of the chat attachments: camera, photo gallery, documents. Photos are converted
// to JPEG and reduced (iPhone HEIC photos are refused by the API; a full-size photo is slow to send).
import * as DocumentPicker from 'expo-document-picker'
import { File } from 'expo-file-system'
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator'
import * as ImagePicker from 'expo-image-picker'

import { DOCUMENT_TYPES, documentFile, photoFile, photoResize, type PickedFile } from './attachments'

/** The phone refused the camera: the message tells where to allow it. */
export class PickerPermissionError extends Error {}

async function asJpeg(asset: ImagePicker.ImagePickerAsset): Promise<PickedFile> {
  const context = ImageManipulator.manipulate(asset.uri)
  const resize = photoResize(asset.width, asset.height)
  if (resize) context.resize(resize)
  const image = await context.renderAsync()
  const saved = await image.saveAsync({ format: SaveFormat.JPEG, compress: 0.8 })
  let size: number | null = null
  try {
    size = new File(saved.uri).size
  } catch {
    // Size unknown: the API still refuses a file over 10 MB.
  }
  return photoFile({ uri: saved.uri, size })
}

export async function takePhoto(): Promise<PickedFile | null> {
  const permission = await ImagePicker.requestCameraPermissionsAsync()
  if (!permission.granted) {
    throw new PickerPermissionError('Autorisez l’appareil photo pour Ask Service dans les réglages du téléphone.')
  }
  const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 1, exif: false })
  const asset = result.canceled ? null : result.assets?.[0]
  return asset ? asJpeg(asset) : null
}

/** The system photo picker: only the chosen photo is shared with the app, no permission asked. */
export async function choosePhoto(): Promise<PickedFile | null> {
  const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 1, exif: false, allowsMultipleSelection: false })
  const asset = result.canceled ? null : result.assets?.[0]
  return asset ? asJpeg(asset) : null
}

export async function chooseDocument(): Promise<PickedFile | null> {
  const result = await DocumentPicker.getDocumentAsync({ type: DOCUMENT_TYPES, copyToCacheDirectory: true, multiple: false })
  const asset = result.canceled ? null : result.assets?.[0]
  return asset ? documentFile(asset) : null
}
