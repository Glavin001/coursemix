#/bin/env bash

APP_NAME=coursemix

echo "Deploy to Bluemix"
cf push #${APP_NAME}

# cf push --buildpack=https://github.com/strongloop/dist-paas-buildpack