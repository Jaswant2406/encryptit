function getPasswordScore(password: string) {
  const lengthScore = Math.min(password.length * 4, 40);
  const varietyScore = [
    /[a-z]/.test(password),
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ].filter(Boolean).length * 12;
  const repeatPenalty = /(.)\1{2,}/.test(password) ? 12 : 0;
  const commonPenalty = /(password|admin|qwerty|letmein|welcome|123456)/i.test(password) ? 25 : 0;

  return Math.max(0, Math.min(100, lengthScore + varietyScore - repeatPenalty - commonPenalty));
}

export async function auditSecurity(config: string) {
  const entropyMatch = config.match(/Avg Entropy:\s*([0-9.]+)/i);
  const fileMatch = config.match(/Total Files:\s*(\d+)/i);
  const entropy = entropyMatch ? Number(entropyMatch[1]) : 0;
  const fileCount = fileMatch ? Number(fileMatch[1]) : 0;

  const posture = entropy >= 7.5 ? "Strong" : entropy >= 6.5 ? "Moderate" : "Needs attention";
  const findings = [
    `Security posture: ${posture}.`,
    `Tracked encrypted files: ${fileCount}.`,
    `Average post-encryption entropy: ${entropy.toFixed(2)} bits per byte.`,
    entropy >= 7.5
      ? "Encrypted payloads show high randomness, which is expected for strong encryption."
      : "Review password quality and protocol choices for files with lower entropy.",
    "Keep recovery keys offline, use unique access keys, and rotate weak credentials.",
  ];

  return findings.join("\n");
}

export async function analyzePassword(password: string) {
  const score = getPasswordScore(password);
  const recommendations = [];

  if (password.length < 12) recommendations.push("Use at least 12 characters.");
  if (!/[A-Z]/.test(password)) recommendations.push("Add uppercase letters.");
  if (!/[a-z]/.test(password)) recommendations.push("Add lowercase letters.");
  if (!/[0-9]/.test(password)) recommendations.push("Add numbers.");
  if (!/[^A-Za-z0-9]/.test(password)) recommendations.push("Add symbols.");
  if (/(.)\1{2,}/.test(password)) recommendations.push("Avoid repeated characters.");
  if (recommendations.length === 0) recommendations.push("Password structure looks strong.");

  return `Password score: ${score}/100.\n${recommendations.join("\n")}`;
}
