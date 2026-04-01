import {
  ArrowForwardIos,
  ContentCopy,
  Delete,
  Api,
} from "@mui/icons-material";
import React, { memo } from "react";
import { Handle } from "react-flow-renderer";
import { useNodeStorage } from "../../../stores/useNodeStorage";
import { Typography, Box } from "@mui/material";

const saveLabel = (mode) => {
  if (mode === "full") return "Resposta completa";
  if (mode === "extract") return "Extrair campos";
  return "Não salvar";
};

export default memo(({ data, isConnectable, id }) => {
  const storageItems = useNodeStorage();
  const method = (data?.method || "GET").toUpperCase();
  const urlPreview = (data?.url || "").slice(0, 42) || "—";
  const mode = data?.saveResponseMode || "none";

  return (
    <div
      style={{
        backgroundColor: "#E8F4FD",
        padding: "8px",
        borderRadius: "8px",
        width: "210px",
        border: "1px solid rgba(2, 119, 189, 0.4)",
        boxShadow: "rgba(0, 0, 0, 0.05) 0px 3px 5px",
      }}
    >
      <Handle
        type="target"
        position="left"
        style={{
          background: "#0277bd",
          width: "18px",
          height: "18px",
          top: "22px",
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
          sx={{ width: "12px", height: "12px", color: "#0277bd" }}
        />
        <Delete
          onClick={() => {
            storageItems.setNodesStorage(id);
            storageItems.setAct("delete");
          }}
          sx={{ width: "12px", height: "12px", color: "#0277bd" }}
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
        <Api sx={{ width: "18px", height: "18px", mr: 0.5, color: "#0277bd" }} />
        <span style={{ fontWeight: 600 }}>HTTP Request</span>
      </div>
      <Typography variant="caption" sx={{ display: "block", mt: 0.5, color: "#1565c0", fontWeight: 600 }}>
        {method}
      </Typography>
      <Typography
        variant="caption"
        sx={{
          display: "block",
          mt: 0.25,
          color: "#444",
          fontSize: "10px",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
        title={data?.url || ""}
      >
        {urlPreview}
      </Typography>
      <Typography variant="caption" sx={{ display: "block", mt: 0.5, color: "#555", fontSize: "10px" }}>
        {saveLabel(mode)}
      </Typography>
      <Box sx={{ mt: 1, position: "relative", height: 56 }}>
        <Typography
          variant="caption"
          sx={{ position: "absolute", right: 28, top: 2, color: "#2e7d32", fontWeight: 600 }}
        >
          Sucesso
        </Typography>
        <Handle
          type="source"
          position="right"
          id="success"
          style={{
            background: "#2e7d32",
            width: "16px",
            height: "16px",
            right: "-10px",
            top: 6,
            cursor: "pointer",
          }}
          isConnectable={isConnectable}
        />
        <Typography
          variant="caption"
          sx={{ position: "absolute", right: 28, bottom: 2, color: "#c62828", fontWeight: 600 }}
        >
          Erro
        </Typography>
        <Handle
          type="source"
          position="right"
          id="error"
          style={{
            background: "#c62828",
            width: "16px",
            height: "16px",
            right: "-10px",
            bottom: 2,
            cursor: "pointer",
          }}
          isConnectable={isConnectable}
        />
      </Box>
    </div>
  );
});
