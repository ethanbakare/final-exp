export const currentProjectQuery = `*[_type == "currentProject" && isLive == true][0] {
  ...,
  "focusBadge": focusBadge->{
    _id,
    title,
    color,
    tooltipText
  },
  "projectProgressId": projectProgress._ref
}`
export const projectItemsQuery = `*[_type == "projectItem"] {
  ...,
  "focusBadge": focusBadge->{
    _id,
    title,
    color,
    tooltipText
  }
} | order(votes desc)`
export const projectItemByIdQuery = `*[_type == "projectItem" && id == $id][0] {
  ...,
  "focusBadge": focusBadge->{
    _id,
    title,
    color,
    tooltipText
  }
}`

export const projectProgressByIdQuery = `*[_type == "projectProgress" && _id == $id][0] {
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