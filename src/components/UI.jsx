import React from "react";

export const Badge = ({ children }) => <span className="badge">{children}</span>;
export const Chip  = ({ children }) => <span className="chip">{children}</span>;
export const Button = ({ children, className = "", ...props }) =>
  <button className={`btn ${className}`} {...props}>{children}</button>;
export const Card = ({ children, className = "" }) =>
  <div className={`card ${className}`}>{children}</div>;
