import * as React from "react";

import { cn } from "../../lib/utils";

function Card({ className, ...props }) {
  // Filter out non-DOM props
  const { jsx, ...domProps } = props;

  return (
    <div
      data-slot="card"
      className={cn(
        "bg-card text-card-foreground flex flex-col gap-6 rounded-xl border",
        className,
      )}
      {...domProps}
    />
  );
}

function CardHeader({ className, ...props }) {
  const { jsx, ...domProps } = props;
  return (
    <div
      data-slot="card-header"
      className={cn(
        "@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5 px-6 pt-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6",
        className,
      )}
      {...domProps}
    />
  );
}

function CardTitle({ className, ...props }) {
  const { jsx, ...domProps } = props;
  return (
    <h4
      data-slot="card-title"
      className={cn("leading-none", className)}
      {...domProps}
    />
  );
}

function CardDescription({ className, ...props }) {
  const { jsx, ...domProps } = props;
  return (
    <p
      data-slot="card-description"
      className={cn("text-muted-foreground", className)}
      {...domProps}
    />
  );
}

function CardAction({ className, ...props }) {
  const { jsx, ...domProps } = props;
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className,
      )}
      {...domProps}
    />
  );
}

function CardContent({ className, ...props }) {
  const { jsx, ...domProps } = props;
  return (
    <div
      data-slot="card-content"
      className={cn("px-6 [&:last-child]:pb-6", className)}
      {...domProps}
    />
  );
}

function CardFooter({ className, ...props }) {
  const { jsx, ...domProps } = props;
  return (
    <div
      data-slot="card-footer"
      className={cn("flex items-center px-6 pb-6 [.border-t]:pt-6", className)}
      {...domProps}
    />
  );
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
};