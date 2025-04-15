export const currentProjectQuery = `*[_type == "currentProject"][0] {
  ...,
  "focusBadge": focusBadge->{
    _id,
    title,
    color
  }
}`
export const projectItemsQuery = `*[_type == "projectItem"] {
  ...,
  "focusBadge": focusBadge->{
    _id,
    title,
    color
  }
} | order(votes desc)`
export const projectItemByIdQuery = `*[_type == "projectItem" && id == $id][0] {
  ...,
  "focusBadge": focusBadge->{
    _id,
    title,
    color
  }
}`

export const projectProgressQuery = `*[_type == "projectProgress"][0] {
  _id,
  title,
  "modalImage": modalImage.asset->{
    _ref,
    url
  },
  tasks[] {
    title,
    subtasks
  }
}` 