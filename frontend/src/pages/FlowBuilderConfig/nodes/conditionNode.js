import {
  ArrowForwardIos,
  ContentCopy,
  Delete,
  FilterList,
} from "@mui/icons-material";
import React, { memo } from "react";
import { Handle } from "react-flow-renderer";
import { useNodeStorage } from "../../../stores/useNodeStorage";
import { Typography, Box } from "@mui/material";

const summarize = (data) => {
  const mode = data?.mode === "any" ? "OU" : "E";
  const n = Array.isArray(data?.rules) ? data.rules.length : 0;
  if (n === 0) return "Sem regras";
  return `${n} regra(s) · ${mode}`;
};

export default memo(({ data, isConnectable, id }) => {
  const storageItems = useNodeStorage();

  return (
    <div
      style={{
        backgroundColor: "#F3F8F4",
        padding: "8px",
        borderRadius: "8px",
        width: "200px",
        border: "1px solid rgba(34, 139, 34, 0.35)",
        boxShadow: "rgba(0, 0, 0, 0.05) 0px 3px 5px",
      }}
    >
      <Handle
        type="target"
        position="left"
        style={{
          background: "#228B22",
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
          sx={{ width: "12px", height: "12px", color: "#228B22" }}
        />
        <Delete
          onClick={() => {
            storageItems.setNodesStorage(id);
            storageItems.setAct("delete");
          }}
          sx={{ width: "12px", height: "12px", color: "#228B22" }}
        />
      </div>
      <div
        style={{
          color: "#232323",
          fontSize: "16px",
          flexDirection: "row",
          display: "flex",
          alignItems: "center",
        }}
      >
        <FilterList sx={{ width: "18px", height: "18px", mr: 0.5, color: "#228B22" }} />
        <div style={{ fontWeight: 600 }}>Condição</div>
      </div>
      <Typography
        variant="caption"
        sx={{
          display: "block",
          mt: 0.5,
          color: "#444",
          fontSize: "11px",
          lineHeight: 1.3,
        }}
      >
        {summarize(data)}
      </Typography>
      <Box sx={{ mt: 1, position: "relative", height: 56 }}>
        <Typography
          variant="caption"
          sx={{ position: "absolute", right: 28, top: 4, color: "#2e7d32", fontWeight: 600 }}
        >
          Sim
        </Typography>
        <Handle
          type="source"
          position="right"
          id="true"
          style={{
            background: "#2e7d32",
            width: "16px",
            height: "16px",
            right: "-10px",
            top: 8,
            cursor: "pointer",
          }}
          isConnectable={isConnectable}
        />
        <Typography
          variant="caption"
          sx={{ position: "absolute", right: 28, bottom: 4, color: "#c62828", fontWeight: 600 }}
        >
          Não
        </Typography>
        <Handle
          type="source"
          position="right"
          id="false"
          style={{
            background: "#c62828",
            width: "16px",
            height: "16px",
            right: "-10px",
            bottom: 4,
            cursor: "pointer",
          }}
          isConnectable={isConnectable}
        />
      </Box>
    </div>
  );
});
