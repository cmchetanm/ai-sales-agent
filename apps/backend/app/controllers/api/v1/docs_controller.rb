# frozen_string_literal: true

module Api
  module V1
    class DocsController < ApplicationController
      skip_before_action :verify_authenticity_token, raise: false rescue nil
      skip_before_action :authenticate_user!, raise: false

      def openapi
        path = Rails.root.join('config', 'openapi.yaml')
        return render json: { error: 'Not Found' }, status: :not_found unless File.exist?(path)

        send_file path, type: 'text/yaml', disposition: 'inline'
      end

      def ui
        html = <<~HTML
          <!doctype html>
          <html>
          <head>
            <meta charset="utf-8" />
            <title>API Docs</title>
            <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
          </head>
          <body>
            <div id="swagger-ui"></div>
            <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
            <script>
              window.ui = SwaggerUIBundle({
                url: '/api/v1/openapi.yaml',
                dom_id: '#swagger-ui',
                presets: [SwaggerUIBundle.presets.apis],
                layout: 'BaseLayout'
              });
            </script>
          </body>
          </html>
        HTML
        render html: html.html_safe
      end
    end
  end
end

