import { List } from "@raycast/api";

export default function Command() {
  return (
    <List isShowingDetail>
      <List.Item
        title="Event Name"
        subtitle="Sample Event"
      />
    </List>
  )
}