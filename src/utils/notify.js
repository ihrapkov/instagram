import { ElMessage } from 'element-plus'

export function notifySuccess(message) {
  ElMessage.success(message)
}

export function notifyError(message) {
  ElMessage.error(message)
}

export function notifyWarning(message) {
  ElMessage.warning(message)
}

export function notifyInfo(message) {
  ElMessage.info(message)
}
