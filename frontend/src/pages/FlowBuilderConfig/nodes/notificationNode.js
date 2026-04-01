import {
  ArrowForwardIos,
  ContentCopy,
  Delete,
  NotificationsActive,
} from "@mui/icons-material";
import React, { memo } from "react";
import { Handle } from "react-flow-renderer";
import { useNodeStorage } from "../../../stores/useNodeStorage";
import { Typography } from "@mui/material";

export default memo(({ data, isConnectable, id }) => {
  const storageItems = useNodeStorage();
  const phone = (data?.phone || "").slice(0, 28) || "—";
  const preview = (data?.message || "").slice(0, 40) || "—";

  return (
    <div
      style={{
        backgroundColor: "#FFF8E7",
        padding: "8px",
        borderRadius: "8px",
        width: "200px",
        border: "1px solid rgba(245, 124, 0, 0.45)",
        boxShadow: "rgba(0, 0, 0, 0.05) 0px 3px 5px",
      }}
    >
      <Handle
        type="target"
        position="left"
        style={{
          background: "#f57c00",
          width: "18px",
          height: "18px",
          top: "20px",
          left: "-12px",
          cursor: "pointer",
        }}
        isConnectable={isConnectable}
      >
        <ArrowForwardIos
          sx={{
            color: "#ffff",
            width: "10px",
            height: "10px",
            marginLeft: "3.5px",
            marginBottom: "1px",
            pointerEvents: "none",
          }}
        />
      </Handle>
      <div
        style={{
          display: "flex",
          position: "absolute",
          right: 5,
          top: 5,
          cursor: "pointer",
          gap: 6,
        }}
      >
        <ContentCopy
          onClick={() => {
            storageItems.setNodesStorage(id);
            storageItems.setAct("duplicate");
          }}
          sx={{ width: "12px", height: "12px", color: "#f57c00" }}
        />
        <Delete
          onClick={() => {
            storageItems.setNodesStorage(id);
            storageItems.setAct("delete");
          }}
          sx={{ width: "12px", height: "12px", color: "#f57c00" }}
        />
      </div>
      <div
        style={{
          color: "#232323",
          fontSize: "16px",
          display: "flex",
          alignItems: "center",
        }}
      >
        <NotificationsActive sx={{ width: "18px", height: "18px", mr: 0.5, color: "#f57c00" }} />
        <span style={{ fontWeight: 600 }}>Notificação</span>
      </div>
      <Typography
        variant="caption"
        sx={{
          display: "block",
          mt: 0.5,
          color: "#555",
          fontSize: "10px",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
        title={data?.phone || ""}
      >
        {phone}
      </Typography>
      <Typography
        variant="caption"
        sx={{
          display: "block",
          mt: 0.25,
          color: "#666",
          fontSize: "10px",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
        title={data?.message || ""}
      >
        {preview}
      </Typography>
      <Handle
        type="source"
        position="right"
        id="a"
        style={{
          background: "#f57c00",
          width: "18px",
          height: "18px",
          right: "-11px",
          top: "50%",
          transform: "translateY(-50%)",
          cursor: "pointer",
        }}
        isConnectable={isConnectable}
      >
        <ArrowForwardIos
          sx={{
            color: "#ffff",
            width: "10px",
            height: "10px",
            marginLeft: "2.9px",
            marginBottom: "1px",
            pointerEvents: "none",
          }}
        />
      </Handle>
    </div>
  );
});
