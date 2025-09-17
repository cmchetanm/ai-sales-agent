FROM ruby:3.3

RUN apt-get update -qq && \
    apt-get install -y --no-install-recommends build-essential libpq-dev nodejs && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY Gemfile Gemfile.lock /app/
RUN bundle config set --local path /usr/local/bundle && \
    bundle install

COPY . /app

EXPOSE 3000

CMD ["bash", "-lc", "bin/rails server -b 0.0.0.0 -p 3000"]
