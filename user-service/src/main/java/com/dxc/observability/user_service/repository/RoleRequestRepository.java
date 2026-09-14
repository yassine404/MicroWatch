package com.dxc.observability.user_service.repository;

import com.dxc.observability.user_service.entity.RoleRequest;
import com.dxc.observability.user_service.enums.RequestStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface RoleRequestRepository extends JpaRepository<RoleRequest, UUID> {
    List<RoleRequest> findByStatus(RequestStatus status);
    List<RoleRequest> findByUserId(UUID userId);
}