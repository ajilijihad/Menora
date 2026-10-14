import type { ReactNode } from "react";

import { StatusPanel } from "./status-panel";

type EmptyStateProps = {
  title: string;
  description: string;
  action?: ReactNode;
};

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <StatusPanel title={title} description={description}>
      {action}
    </StatusPanel>
  );
}
