export function getProfileId(profile) {
  return profile?._id || profile?.id
}
