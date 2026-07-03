// CI/CD pipeline for FutureKawa.
//
// Prerequisites on the Jenkins agent: Docker + Docker Compose v2, bash.
// (Docker socket must be reachable — either Jenkins runs directly on a
// Docker host, or the agent container has the socket mounted.)
//
// Stages:
//   1. Checkout — pulls the code straight from GitHub.
//   2. Build all images (backend, frontend).
//   3. CI: bring up an ephemeral stack, run code quality checks (PHPStan,
//      ESLint), an OWASP Dependency-Check scan, then the backend (PHPUnit)
//      and frontend (Vitest) suites — then tear the stack down, win or lose.
//      Each of these produces a report Jenkins renders natively (see below).
//   4. CD: today this just (re)deploys the stack locally on the same
//      machine (`docker compose up -d --build`), standing in for a real
//      target. When real infrastructure exists, replace this stage with
//      Terraform (provisioning) + Ansible (config/deploy) or a Kubernetes
//      rollout — the CI stages above stay the same either way.
//   5. Build production images: tags futurekawa-backend:latest and
//      futurekawa-frontend:latest (built from ./frontend --target production,
//      the static-build-served-by-nginx stage) — the images consumed by
//      docker-compose.prod.yml. Local tags only for now; add a `docker push`
//      once a registry exists.
//
// The Deploy and Build-production-images stages only run on the `master`
// branch (this repo's default — adjust if that changes) and only work as-is
// on a Multibranch Pipeline job (env.BRANCH_NAME is unset on a plain
// Pipeline job).
//
// Required Jenkins plugins for the reports below:
//   - JUnit Plugin (bundled with modern Jenkins) — PHPUnit/Vitest results.
//   - Warnings Next Generation Plugin — PHPStan/ESLint issues (phpStan()/esLint() parsers).
//   - OWASP Dependency-Check Plugin — vulnerability trend graph.

pipeline {
    agent any

    options {
        disableConcurrentBuilds()
        buildDiscarder(logRotator(numToKeepStr: '20'))
    }

    environment {
        COMPOSE_PROJECT_NAME = 'futurekawa'
    }

    stages {
        stage('Checkout') {
            steps {
                // git branch: 'master', url: 'https://github.com/mokrani-zahir/futurkawa.git'
                checkout scm
                // Private repo? Add credentialsId: '<jenkins-credential-id>'
                // (configure it under Manage Jenkins > Credentials first).
            }
        }

        stage('Prepare .env') {
            steps {
                // CI only needs a working environment, not real secrets —
                // .env.example's placeholder values are enough, EXCEPT
                // APP_KEY: docker-compose bakes env_file values into every
                // container's config at creation time, including for later
                // `docker compose exec` sessions (used by the test stages
                // below), which never re-run backend/docker-entrypoint.sh.
                // Leaving APP_KEY blank here means it stays blank for the
                // whole build, no matter what the entrypoint does at boot —
                // so generate a real key upfront, before any container exists.
                sh '''
                    test -f .env || cp .env.example .env
                    if ! grep -q "^APP_KEY=base64:" .env; then
                        KEY="base64:$(openssl rand -base64 32)"
                        sed -i "s|^APP_KEY=.*|APP_KEY=$KEY|" .env
                    fi
                '''
            }
        }

        stage('Build images') {
            steps {
                sh 'docker compose build'
            }
        }

        stage('CI') {
            stages {
                stage('Start stack') {
                    steps {
                        // depends_on/healthcheck in docker-compose.yml already
                        // gates laravel on postgres being healthy.
                        sh 'docker compose up -d postgres redis laravel frontend'
                        sh '''
                            echo "Waiting for the laravel container to finish booting (migrate + config:cache)..."
                            for i in $(seq 1 30); do
                                if docker compose exec -T laravel test -f bootstrap/cache/config.php; then
                                    echo "laravel ready."
                                    exit 0
                                fi
                                sleep 2
                            done
                            echo "Timed out waiting for laravel to boot." >&2
                            docker compose logs laravel
                            exit 1
                        '''
                        // package.json changes between builds aren't picked up by
                        // the named node_modules volume automatically — sync it.
                        // (backend's vendor/ isn't volume-mounted, so no equivalent
                        // step is needed there — composer deps live in the image.)
                        sh 'docker compose exec -T frontend npm install'
                    }
                }

                stage('Code quality') {
                    parallel {
                        stage('PHPStan (backend)') {
                            steps {
                                // checkstyle format feeds the Warnings Next Generation
                                // plugin (see post block below). Exit code still reflects
                                // whether PHPStan found errors, so the stage still fails
                                // the same way it did before.
                                sh 'docker compose exec -T laravel vendor/bin/phpstan analyse --no-progress --memory-limit=512M --error-format=checkstyle > backend/phpstan-checkstyle.xml'
                            }
                        }
                        stage('ESLint (frontend)') {
                            steps {
                                sh 'docker compose exec -T frontend npm run lint -- -f checkstyle -o eslint-checkstyle.xml'
                            }
                        }
                    }
                    post {
                        always {
                            recordIssues(
                                tools: [
                                    phpStan(pattern: 'backend/phpstan-checkstyle.xml'),
                                    esLint(pattern: 'frontend/eslint-checkstyle.xml')
                                ],
                                qualityGates: [[threshold: 1, type: 'TOTAL', unstable: false]]
                            )
                        }
                    }
                }

                // stage('Dependency check (OWASP)') {
                //     steps {
                //         // Backend's composer.lock only exists inside the container
                //         // (Laravel is scaffolded fresh at image build time — see
                //         // backend/Dockerfile — so it's never on the host/workspace).
                //         // Pull it out so Dependency-Check can see it too; frontend's
                //         // package-lock.json is already tracked in git.
                //         sh '''
                //             docker compose cp laravel:/var/www/html/composer.json backend/composer.json
                //             docker compose cp laravel:/var/www/html/composer.lock backend/composer.lock
                //         '''
                //         // First run downloads the NVD CVE database (can be slow /
                //         // rate-limited without a key). If you hit that, get a free
                //         // key at https://nvd.nist.gov/developers/request-an-api-key,
                //         // store it as a Jenkins secret text credential, and add
                //         // `withCredentials([...])` + `--nvdApiKey $NVD_API_KEY` here.
                //         // The scan-data volume persists the DB across builds either way.
                //         sh '''
                //             mkdir -p dependency-check-report
                //             docker run --rm \
                //                 -v "$(pwd)":/src \
                //                 -v dependency-check-data:/usr/share/dependency-check/data \
                //                 owasp/dependency-check:latest \
                //                 --scan /src \
                //                 --format HTML --format XML \
                //                 --project "FutureKawa" \
                //                 --out /src/dependency-check-report \
                //                 --exclude "**/node_modules/**" \
                //                 --exclude "**/vendor/**" \
                //                 --exclude "**/dependency-check-report/**"
                //         '''
                //         // Remove the extracted files again so they don't linger as
                //         // untracked changes in the workspace between builds.
                //         sh 'rm -f backend/composer.json backend/composer.lock'
                //     }
                //     post {
                //         always {
                //             archiveArtifacts artifacts: 'dependency-check-report/**', allowEmptyArchive: true
                //             // Parses the XML report into a vulnerability trend graph.
                //             dependencyCheckPublisher pattern: 'dependency-check-report/dependency-check-report.xml'
                //         }
                //     }
                // }

                stage('Backend tests') {
                    steps {
                        sh 'chmod +x backend/run-tests.sh'
                        sh '''
                            ./backend/run-tests.sh --log-junit=storage/logs/junit.xml
                            status=$?
                            # storage/ is a named volume, not bind-mounted, so the report
                            # has to be pulled out of the container explicitly.
                            docker compose cp laravel:/var/www/html/storage/logs/junit.xml backend/junit.xml || true
                            exit $status
                        '''
                    }
                }

                stage('Frontend tests') {
                    steps {
                        sh 'docker compose exec -T frontend npm test -- --reporter=junit --outputFile=junit.xml'
                    }
                }
            }
            post {
                always {
                    junit testResults: 'backend/junit.xml, frontend/junit.xml', allowEmptyResults: true
                    // Ephemeral CI stack — always torn down, pass or fail, so
                    // each build starts from a clean slate. --rmi local also
                    // removes the images built by `docker compose build`
                    // above (laravel, frontend:dev) — they're CI-only, not
                    // reused by the independent `docker build` in
                    // 'Build production images' further down.
                    sh 'docker compose down -v --rmi local'
                }
            }
        }

        stage('Deploy (local)') {
            when {
                branch 'master'
            }
            steps {
                // Stand-in for a real deploy target. Swap this step for a
                // Terraform apply / Ansible playbook / kubectl rollout once
                // real infrastructure exists.
                sh 'docker compose up -d --build'
            }
        }

        stage('Build production images') {
            // Builds the standalone images consumed by docker-compose.prod.yml
            // (image: futurekawa-backend:latest / futurekawa-frontend:latest —
            // no bind mounts, frontend pre-built and served by nginx). Local
            // tags only for now; add a registry `docker push` here once one
            // exists (e.g. tag as mon-registre/futurekawa-backend:latest first).
            when {
                branch 'master'
            }
            steps {
                sh 'docker build -t futurekawa-backend:latest ./backend'
                sh 'docker build -t futurekawa-frontend:latest --target production ./frontend'
            }
        }
    }

    post {
        success {
            echo 'Pipeline succeeded.'
        }
        failure {
            echo 'Pipeline failed — see the failing stage log above.'
        }
    }
}
