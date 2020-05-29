import { toast } from 'react-toastify';

export class ReactNotificationHandler {
  static addNotification(options) {
    const { title, message } = options
    const toastType = options.type ? options.type : "info" //success, dark, info, default, warn
    if(toastType === 'default') {
      toast(message)
    } else {
      toast[toastType](message)
    }
  }
}
