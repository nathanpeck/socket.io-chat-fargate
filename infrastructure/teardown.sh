#!/bin/bash
# This is a cleanup script for the Serverless First Workshop
# Code Repository https://github.com/nathanpeck/socket.io-chat-fargate

AWS_REGION=$(aws configure get region)
echo "Region has been set to $AWS_REGION"
AWS_ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
echo "Account has been set to $AWS_ACCOUNT"

# List of stack names to delete
stack_names=("chat-cloudfront" "chat-web" "chat-message-search" "chat-message-indexer" "chat-service" "chat-resources" "chat-cluster")

# List of ECR repositories to delete
ecr_repos=("fargate-chat" "apprunner-web")

# Loop through each stack name
for (( i=0; i<${#stack_names[@]}; i++ ))
do
	stack_name=${stack_names[$i]}
	# Check if stack exists
	describe_output=$(aws cloudformation describe-stacks --stack-name "$stack_name" 2>&1)
	status=$?
	if [ $status -eq 0 ]; then
		# If stack exists, initiate deletion process
		echo "Stack $(($i+1))/${#stack_names[@]} being deleted: $stack_name"
		delete_output=$(aws cloudformation delete-stack --stack-name "$stack_name" 2>&1)
		status=$?
		if [ $status -eq 0 ]; then
			# If deletion initiated, check deletion status
			echo "Deletion of stack $stack_name initiated."
			status_output=""
			while [ "$status_output" != "DELETE_COMPLETE" ]
			do
				status_output=$(aws cloudformation describe-stacks --stack-name "$stack_name" --query "Stacks[0].StackStatus" --output text 2>&1)
				status=$?
				if [ $status -ne 0 ]; then
					# If error checking status, print error message and break loop
					echo "Error checking status of stack $stack_name: $status_output"
					break
				fi
				# Print status bar and wait for 5 seconds before checking status again
				printf "."
				sleep 5
			done
			# If deletion successful, print message indicating stack has been deleted
			echo " Stack $stack_name deleted."
		else
			# If error initiating deletion, print error message
			echo "Error deleting stack $stack_name: $delete_output"
		fi
	else
		# If stack does not exist, print message indicuating stack does not exist
		echo "Stack $stack_name does not exist. Skipping deletion."
	fi
done

# Loop through each ECR repository name
for ecr_repo in "${ecr_repos[@]}"
do
	# Check if ECR repository exists
	describe_output=$(aws ecr describe-repositories --repository-name "$ecr_repo" 2>&1)
	status=$?
	if [ $status -eq 0 ]; then
		# If ECR repository exists, initiate deletion process
		echo "Deleting ECR repository: $ecr_repo"
		delete_output=$(aws ecr delete-repository --repository-name "$ecr_repo" --force 2>&1)
		status=$?
		if [ $status -eq 0 ]; then
			# If deletion successful, print message indicating ECR repository has been deleted
			echo "ECR repository $ecr_repo deleted."
		else
			# If error initiating deletion, print error message
			echo "Error deleting ECR repository $ecr_repo: $delete_output"
		fi
	else
		# If ECR repository does not exist, print message indicating ECR repository does not exist and skip deletion
		echo "ECR repository $ecr_repo does not exist. Skipping deletion."
	fi
done