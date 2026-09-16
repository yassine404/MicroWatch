package com.dxc.observability.user_service.service;

import com.dxc.observability.user_service.dto.CreateUserRequest;
import com.dxc.observability.user_service.dto.UpdateUserRequest;
import com.dxc.observability.user_service.dto.UserResponse;
import com.dxc.observability.user_service.entity.User;
import com.dxc.observability.user_service.enums.AccountStatus;
import com.dxc.observability.user_service.enums.Role;
import com.dxc.observability.user_service.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserResponse createUser(CreateUserRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new RuntimeException("Username already taken");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already in use");
        }
        if (request.getRole() == Role.ADMIN_SUP) {
            throw new RuntimeException("Cannot create ADMIN_SUP via this endpoint");
        }

        User user = User.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .role(request.getRole())
                .build();
        user = userRepository.save(user);
        return mapToResponse(user);
    }

    public List<UserResponse> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public UserResponse getUserById(UUID id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return mapToResponse(user);
    }

    @Transactional
    public UserResponse updateUser(UUID id, UpdateUserRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (request.getEmail() != null && !request.getEmail().equals(user.getEmail())) {
            if (userRepository.existsByEmail(request.getEmail())) {
                throw new RuntimeException("Email already in use");
            }
            user.setEmail(request.getEmail());
        }

        if (request.getRole() != null) {
            // Empêcher de rétrograder un ADMIN_SUP ou de promouvoir en ADMIN_SUP via cet endpoint
            if (user.getRole() == Role.ADMIN_SUP) {
                throw new RuntimeException("Cannot modify role of ADMIN_SUP");
            }
            if (request.getRole() == Role.ADMIN_SUP) {
                throw new RuntimeException("Cannot promote to ADMIN_SUP via this endpoint");
            }
            user.setRole(request.getRole());
        }

        user = userRepository.save(user);
        return mapToResponse(user);
    }

    @Transactional
    public void deleteUser(UUID id, UUID adminSupId) {
        if (id.equals(adminSupId)) {
            throw new RuntimeException("Cannot delete yourself");
        }
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        if (user.getRole() == Role.ADMIN_SUP) {
            throw new RuntimeException("Cannot delete ADMIN_SUP");
        }
        userRepository.delete(user);
    }

    @Transactional
    public UserResponse approveUser(UUID id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        if (user.getStatus() == AccountStatus.ACTIVE) {
            throw new RuntimeException("User already active");
        }
        user.setStatus(AccountStatus.ACTIVE);
        user = userRepository.save(user);
        return mapToResponse(user);
    }

    private UserResponse mapToResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .role(user.getRole())
                .status(user.getStatus())
                .build();
    }
}