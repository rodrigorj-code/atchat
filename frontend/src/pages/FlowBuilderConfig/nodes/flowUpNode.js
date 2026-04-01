import {
  ArrowForwardIos,
  ContentCopy,
  Delete,
  TrendingUp,
} from "@mui/icons-material";
import React, { memo } from "react";
import { Handle } from "react-flow-renderer";
import { useNodeStorage } from "../../../stores/useNodeStorage";
import { Typography } from "@mui/material";

export default memo(({ data, isConnectable, id }) => {
  const storageItems = useNodeStorage();
  const listName = data?.contactList?.name || "—";

  return (
    <div
      style={{
        backgroundColor: "#E8F5E9",
        padding: "8px",
        borderRadius: "8px",
        width: "200px",
        border: "1px solid rgba(46, 125, 50, 0.4)",
        boxShadow: "rgba(0, 0, 0, 0.05) 0px 3px 5px",
      }}
    >
      <Handle
        type="target"
        position="left"
        style={{
          background: "#2e7d32",
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
          sx={{ width: "12px", height: "12px", color: "#2e7d32" }}
        />
        <Delete
          onClick={() => {
            storageItems.setNodesStorage(id);
            storageItems.setAct("delete");
          }}
          sx={{ width: "12px", height: "12px", color: "#2e7d32" }}
        />
      </div>
      <div
        style={{
          color: "#232323",
          fontSize: "15px",
          display: "flex",
          alignItems: "center",
        }}
      >
        <TrendingUp sx={{ width: "18px", height: "18px", mr: 0.5, color: "#2e7d32" }} />
        <span style={{ fontWeight: 600 }}>FlowUp</span>
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
        title={listName}
      >
        {listName}
      </Typography>
      <Handle
        type="source"
        position="right"
        id="a"
        style={{
          background: "#2e7d32",
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
