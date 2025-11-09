# ✅ Amazon Linux 2023 base for Python 3.12 Lambda runtime
FROM public.ecr.aws/lambda/python:3.12

# Create the correct folder structure for Lambda layers
RUN mkdir -p /opt/python/lib/python3.12/site-packages

# Install zip utility so we can package inside container
RUN dnf install -y zip

# Install xlrd for .xls support
RUN pip install --no-cache-dir xlrd==1.2.0 -t /opt/python/lib/python3.12/site-packages --no-user


# Copy for zipping
RUN mkdir -p /layer && cp -r /opt/python /layer/
WORKDIR /layer
