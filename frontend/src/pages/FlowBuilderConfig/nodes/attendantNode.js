import {
  ArrowForwardIos,
  ContentCopy,
  Delete,
  Person,
} from "@mui/icons-material";
import React, { memo } from "react";
import { Handle } from "react-flow-renderer";
import { useNodeStorage } from "../../../stores/useNodeStorage";
import { Typography } from "@mui/material";

export default memo(({ data, isConnectable, id }) => {
  const storageItems = useNodeStorage();
  const name = data?.user?.name || "—";

  return (
    <div
      style={{
        backgroundColor: "#F5F0FF",
        padding: "8px",
        borderRadius: "8px",
        width: "190px",
        border: "1px solid rgba(103, 58, 183, 0.35)",
        boxShadow: "rgba(0, 0, 0, 0.05) 0px 3px 5px",
      }}
    >
      <Handle
        type="target"
        position="left"
        style={{
          background: "#673AB7",
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
          sx={{ width: "12px", height: "12px", color: "#673AB7" }}
        />
        <Delete
          onClick={() => {
            storageItems.setNodesStorage(id);
            storageItems.setAct("delete");
          }}
          sx={{ width: "12px", height: "12px", color: "#673AB7" }}
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
        <Person sx={{ width: "18px", height: "18px", mr: 0.5, color: "#673AB7" }} />
        <span style={{ fontWeight: 600 }}>Atendente</span>
      </div>
      <Typography
        variant="caption"
        sx={{
          display: "block",
          mt: 0.5,
          color: "#444",
          fontSize: "11px",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
        title={name}
      >
        {name}
      </Typography>
      <Handle
        type="source"
        position="right"
        id="a"
        style={{
          background: "#673AB7",
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
