FROM alpine:latest

# Install curl for downloading models
RUN apk add --no-cache curl

# Copy the model loader script
COPY model-loader.sh /scripts/model-loader.sh
RUN chmod +x /scripts/model-loader.sh

# Set the entrypoint
ENTRYPOINT ["/bin/sh", "/scripts/model-loader.sh"]
