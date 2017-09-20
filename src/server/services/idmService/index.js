import {default as deactivateUser} from './deactivateUser'
import {default as reactivateUser} from './reactivateUser'
import {default as findUsers} from './findUsers'
import {default as getUser} from './getUser'
import {default as getUsersByHandles} from './getUsersByHandles'
import {default as getUsersByIds} from './getUsersByIds'

/**
* NOTE: this service's functions are exported the way they are to enable
* certain stubbing functionality functionality for testing that relies on the
* way the module is cached and later required by dependent modules.
*/
export default {
  deactivateUser,
  reactivateUser,
  findUsers,
  getUser,
  getUsersByHandles,
  getUsersByIds,
}
