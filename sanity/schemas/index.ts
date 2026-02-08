// Schema index - import all schemas here
import event from './event'
import newsArticle from './newsArticle'
import presentation from './presentation'
import boardMember from './boardMember'
import siteSettings from './siteSettings'
import page from './page'

export const schemaTypes = [
  // Documents
  event,
  newsArticle,
  presentation,
  boardMember,
  page,
  
  // Singletons
  siteSettings,
]
