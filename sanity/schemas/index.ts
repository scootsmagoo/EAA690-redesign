// Schema index - import all schemas here
import event from './event'
import newsArticle from './newsArticle'
import newsletterIssue from './newsletterIssue'
import presentation from './presentation'
import boardMember from './boardMember'
import kudos from './kudos'
import siteSettings from './siteSettings'
import homePage from './homePage'
import newsPage from './newsPage'
import mediaPage from './mediaPage'
import mediaGallery from './mediaGallery'
import page from './page'
import storeCategory from './storeCategory'
import storeProduct from './storeProduct'
import programPage, { programSectionTypes } from './programPage'
import programsPage from './programsPage'
import privacyPage from './privacyPage'
import kudosPage from './kudosPage'

export const schemaTypes = [
  // Objects (program section blocks — must be registered)
  ...programSectionTypes,
  // Documents
  event,
  newsArticle,
  newsletterIssue,
  presentation,
  boardMember,
  kudos,
  mediaGallery,
  page,
  storeCategory,
  storeProduct,
  programPage,

  // Singletons
  homePage,
  newsPage,
  mediaPage,
  programsPage,
  privacyPage,
  kudosPage,
  siteSettings,
]
