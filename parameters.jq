[
    {
        "ParameterKey": "CodeS3Bucket",
        "ParameterValue": ($ENV.BUCKET_NAME // ( "No BUCKET_NAME" | error )),
    },
    {
        "ParameterKey": "CodeS3Key",
        "ParameterValue": "\( $ENV.BUCKET_KEY_PREFIX // "" )bundle.\( $ENV.BUNDLE_CHECKSUM // ( "No BUNDLE_CHECKSUM" | error ) ).zip",
    }
]