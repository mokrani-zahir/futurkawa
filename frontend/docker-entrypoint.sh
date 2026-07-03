#!/bin/sh
set -e

# Regenerates env-config.js from the container's environment (populated by
# frontend/.env.production via env_file) so the same built image can be
# pointed at any backend without a rebuild.
cat <<EOF > /usr/share/nginx/html/env-config.js
window.__ENV__ = {
  API_URL: "${API_URL:-}"
};
EOF
