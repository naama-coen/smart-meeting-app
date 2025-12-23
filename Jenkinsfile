pipeline {
    agent any

    tools {
        nodejs 'node20'
    }

    stages {
        stage('Install Dependencies') {
            steps {
                sh 'node -v'
                sh 'npm -v'
                sh 'npm install'
            }
        }

        stage('Run Unit Tests') {
            steps {
                sh 'npm test'
            }
        }

        stage('Build Docker Image') {
            steps {
                script {
                    sh "docker build -t my-node-app:${env.BUILD_NUMBER} ."
                }
            }
        }

        stage('Deploy (Docker)') {
            steps {
                script {
                    sh "docker stop my-app || true"
                    sh "docker rm my-app || true"
                    sh "docker run -d --name my-app -p 3000:3000 my-node-app:${env.BUILD_NUMBER}"
                }
            }
        }
    }
}
